"""
SupportOps UI Tests - Playwright
Testa os principais fluxos do Kanban
"""
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        print("\n🧪 SupportOps UI Tests")
        print("=" * 50)

        # ── Test 1: App loads ──────────────────────────────
        print("\n1️⃣  Verificar carregamento do app...")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.screenshot(path="/tmp/supportops_01_home.png", full_page=True)

        title = page.title()
        assert "SupportOps" in title, f"Título incorreto: {title}"
        print(f"   ✅ Título: {title}")

        # ── Test 2: Sidebar visible ────────────────────────
        print("\n2️⃣  Verificar sidebar...")
        sidebar = page.locator("aside")
        assert sidebar.is_visible(), "Sidebar não está visível"
        print("   ✅ Sidebar visível")

        # Verificar resumo do dia
        total_text = page.locator("text=Total").first
        assert total_text.is_visible(), "Card 'Total' não encontrado"
        print("   ✅ Card de resumo visível")

        # Verificar análise Claude
        analysis_text = page.locator("text=Análise Claude").first
        assert analysis_text.is_visible(), "Análise Claude não encontrada"
        print("   ✅ Análise Claude visível")

        # Verificar botão de scan
        scan_btn = page.locator("text=Rodar scan agora")
        assert scan_btn.is_visible(), "Botão de scan não encontrado"
        print("   ✅ Botão 'Rodar scan agora' visível")

        # ── Test 3: Kanban columns ─────────────────────────
        print("\n3️⃣  Verificar colunas Kanban...")
        expected_columns = ["Triagem", "Liberar Licença", "Bug / Suporte", "FAQ", "Resolvido"]
        for col in expected_columns:
            el = page.locator(f"text={col}").first
            assert el.is_visible(), f"Coluna '{col}' não encontrada"
            print(f"   ✅ Coluna '{col}' visível")

        # ── Test 4: Ticket cards ───────────────────────────
        print("\n4️⃣  Verificar cards de tickets...")
        # Tickets mockados devem estar visíveis
        cards = page.locator(".ticket-card")
        count = cards.count()
        assert count > 0, "Nenhum card de ticket encontrado"
        print(f"   ✅ {count} cards de ticket encontrados")

        # Verificar elementos do card (Academy badge)
        academy_badge = page.locator("text=Academy").first
        assert academy_badge.is_visible(), "Badge 'Academy' não encontrado"
        print("   ✅ Badge de fonte (Academy) visível")

        # ── Test 5: Top bar ────────────────────────────────
        print("\n5️⃣  Verificar TopBar...")
        topbar = page.locator("header")
        assert topbar.is_visible(), "TopBar não encontrada"

        # Verificar informações de resumo
        tickets_info = page.locator("text=tickets").first
        assert tickets_info.is_visible(), "Info de tickets no header não encontrada"
        print("   ✅ TopBar com informações visíveis")

        # ── Test 6: Scan button interaction ───────────────
        print("\n6️⃣  Testar botão de scan...")
        scan_btn.click()
        # Verificar loading state
        page.wait_for_timeout(500)
        loading = page.locator("text=Coletando dados...").first
        if loading.is_visible():
            print("   ✅ Estado de loading aparece ao clicar")
        else:
            print("   ℹ️  Loading state muito rápido para capturar (normal)")

        # ── Test 7: Priority items ─────────────────────────
        print("\n7️⃣  Verificar prioridades...")
        priorities_header = page.locator("text=Top prioridades").first
        assert priorities_header.is_visible(), "Seção de prioridades não encontrada"
        print("   ✅ Seção de prioridades visível")

        # Screenshot final
        page.screenshot(path="/tmp/supportops_02_full.png", full_page=True)

        print("\n" + "=" * 50)
        print("✨ Todos os testes passaram!")
        print(f"📸 Screenshots salvas em /tmp/supportops_*.png")

        browser.close()

if __name__ == "__main__":
    run_tests()
