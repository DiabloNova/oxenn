import os
import re

filepath = "src/app/[locale]/docs/layout.tsx"
if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Mobile sidebar is implemented via state but not actually rendered conditionally below the header
    # Let's fix that.
    sidebar_overlay_replacement = """
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 ${isFa ? 'right-0' : 'left-0'} z-50 w-72 bg-slate-950 transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : (isFa ? 'translate-x-full' : '-translate-x-full')
      }`}>
        {renderSidebarContent()}
      </aside>

      <aside className="hidden md:flex flex-col w-76 lg:w-80 h-screen sticky top-0 shrink-0 overflow-hidden border-e border-white/10">
        {renderSidebarContent()}
      </aside>
"""

    content = re.sub(
        r'<aside className="hidden md:flex flex-col w-76 lg:w-80 h-screen sticky top-0 shrink-0 overflow-hidden border-e border-white/10">\s*\{renderSidebarContent\(\)\}\s*</aside>',
        sidebar_overlay_replacement.strip(),
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w') as f:
        f.write(content)
