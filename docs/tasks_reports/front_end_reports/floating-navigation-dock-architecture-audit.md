# ممیزی معماری و رفتار نوار ناوبری شناور Oxenn

- تاریخ بررسی: ۲۰۲۶-۱۰-۲۹
- شاخه مستقل از main: **audit/floating-navigation-dock**
- commit مبنا: **0a85219c90ccba91d0f796dc6cdd344d84b6e003**
- PR مرتبط: **#98**، شاخه **fix/language-toggle-route-sync**، head بررسی‌شده **767b5e01b35295b6ae10fb13421f5f4e65b67074**
- نوع اقدام: ممیزی فقط‌خواندنی؛ هیچ کد اجرایی در این شاخه تغییر نکرده و PR #98 بسته یا ادغام نشده است.

## 1. نتیجه اجرایی

بهترین مسیر حذف نوار نیست. پیشنهاد می‌شود نوار به **Oxenn Twin Action Dock** تبدیل شود: یک سطح اجرایی فشرده، زمینه‌آگاه و مخصوص فضای کاری که دسترسی سریع به Digital Benchmark Twin، مقایسه، تحلیل شکاف، گفت‌وگو با مدل‌های AI، برنامه اجرایی و اجرای برنامه را فراهم می‌کند.

اما پیش از اضافه‌کردن کاربرد جدید، باید مالکیت کامپوننت و shellها روشن شود، انتقال مسیرها از یک قرارداد مشترک و قابل آزمون عبور کند، و شکست CI در PR #98 برطرف شود. حذف ساده state مربوط به settle، راه‌حل قابل قبول نیست چون می‌تواند باگ مخفی‌ماندن dock در برگشت سریع را برگرداند.

## 2. مالکیت فعلی کامپوننت‌ها در main

مبنای بررسی:
- src/app/[locale]/layout.tsx — blob: 7913e0b9…
- src/components/navigation/FloatingSidebar.tsx — blob: 19c5a88f…
- src/components/navigation/GlobalNavigationControls.tsx — blob: a1690ab8…
- src/components/marketing/LandingHeader.tsx — blob: 6b999026…
- src/components/navigation/AppSidebar.tsx — blob: ea4c6590…

| جزء | مالکیت / محل mount فعلی | مسئله |
|---|---|---|
| FloatingSidebar | در locale layout؛ شرط نمایش با pathname در خود کامپوننت | lifecycle آن به مسیر جاری وابسته است و در انتقال بین public و workspace می‌تواند فریم ناپایدار داشته باشد |
| GlobalNavigationControls | در locale layout؛ کنترل برگشت و بازگشت به بالا | مالک مستقل دارد و ممکن است با dock هم‌پوشانی بصری یا عملی ایجاد کند |
| DashboardSidebar | در dashboard layout | منوی اصلی workspace مستقل از dock است |
| DashboardTopbar | در dashboard layout | جست‌وجوی Ctrl/Cmd+K، انتخاب workspace و اقدام‌های کاربر را دارد؛ بخش‌هایی با dock جدید هم‌پوشان‌اند |
| LandingHeader | در صفحات عمومی؛ خودش AppSidebar را mount می‌کند | مالکیت منوی عمومی با مصرف‌کننده‌های صفحه‌ای تکرارپذیر است |
| AppSidebar | داخل LandingHeader و نیز در چند صفحه عمومی به‌صورت مستقل | در صفحاتی مانند features، industries، resources، blog و contact باید mountهای هم‌زمان drawer/hamburger بررسی و حذف شوند |

### اصل مالکیت پیشنهادی

**یک shell، یک مالک برای هر سطح ناوبری، یک منبع حقیقت برای لینک‌ها.**

- **MarketingShell:** هدر عمومی، منوی سایت، drawer و footer.
- **WorkspaceShell:** منوی اصلی workspace، topbar و Twin Action Dock.
- **AccountShell:** ورود، ثبت‌نام، پروفایل و تنظیمات حساب با قواعد روشن.
- **Route registry مرکزی:** شناسه مسیر، عنوان‌های fa/en، توضیح، گروه محصول، وضعیت قابلیت، سطح دسترسی، canonical route و مسیر اقدام داشبورد را تعریف می‌کند. Navbar، footer، command palette، dock، کاتالوگ خدمات و sitemap باید از آن داده تغذیه شوند.

FloatingSidebar نباید هم‌زمان منوی عمومی، کپی منوی داشبورد و نوار اقدام سریع باشد. در طراحی نهایی، mount نوار باید به shell واقعی workspace محدود شود؛ پنهان‌کردن شرطی پس از تغییر pathname به‌تنهایی تضمین lifecycle نیست.

## 3. رفتار فعلی و منشأ خطر

### 3.1 مسیر و نمایش نوار

در main، دسته‌بندی فضای کاری در FloatingSidebar با بررسی pathname انجام می‌شود و باید به matching دقیق segmentها محدود شود؛ بررسی زیررشته می‌تواند یک مسیر نامرتبط را اشتباهاً workspace تشخیص دهد. مقصدهای dock فعلی ترکیبی از خانه، صفحات عمومی solutions و صفحات پروفایل/تنظیمات‌اند؛ این ساختار برای یک dock عملیاتی در workspace مناسب نیست.

### 3.2 فریم انتقال و دوباره‌ناوبری

در PR #98، event مشترک oxenn:navigation-start معرفی شد. هم click-capture لینک‌های داخلی و هم helperهای ناوبری صریح می‌توانند شروع انتقال را اعلام کنند. راه بهتر، یک API مشخص برای لینک‌ها و navigation برنامه‌ای است تا eventهای تکراری مدیریت شوند.

نوار در PR #98 با state محلی و پنجره آرام‌سازی ۳۰۰ میلی‌ثانیه‌ای مخفی نگه داشته می‌شود. این کار می‌تواند اثر دیداری را کاهش دهد، اما جایگزین معماری lifecycle نیست. Back/Forward، مسیر برگشتی سریع به مبدأ، تغییر query/hash، redirect، مسیر ناموجود و انتقال شکست‌خورده باید حالت‌های مجزا داشته باشند.

### 3.3 هم‌پوشانی با layout داشبورد

DashboardLayout علاوه بر dock شامل DashboardSidebar و DashboardTopbar است. GlobalNavigationControls هم دکمه برگشت/بالا را مستقل نمایش می‌دهد. اگر dock نقش منوی کامل را بگیرد، این کنترل‌ها تکراری‌اند؛ اگر نقش Action Dock را بگیرد، منوی اصلی باید در sidebar/topbar باقی بماند و dock فقط اقدام‌های فوری را نمایش دهد.

### 3.4 صفحات عمومی

صفحات عمومی باید فقط یک منوی عمومی و یک drawer داشته باشند. dock فضای کاری نباید حتی در یک فریم در صفحه عمومی، login/register یا صفحه محتوایی قابل کلیک باشد. راه اصلی تضمین این رفتار، محدودکردن mount به WorkspaceShell است، نه صرفاً پنهان‌سازی شرطی بعد از تغییر pathname.

## 4. بررسی بازخوردهای Cubic و Gitar در PR #98

PR: https://github.com/DiabloNova/oxenn/pull/98

### 4.1 یافته معتبر: دوباره‌ناوبری هنگام تغییر زبان

**ریشه:** ThemeProvider.setLanguage خودش router.replace انجام می‌داد؛ در عین حال DashboardTopbar و caller دیگری هم با router.push مسیر را تغییر می‌دادند. دو انتقال می‌توانستند پشت سر هم رخ دهند، query/hash از بین برود و ورودی تاریخچه اضافه شود.

**وضعیت:** این مورد در commitهای بعدی PR اصلاح و thread مربوطه resolve شده است. مالکیت تغییر locale باید فقط در یک نقطه بماند.

### 4.2 یافته معتبر: زبان ذخیره‌شده بر locale URL غلبه می‌کرد

**ریشه:** localStorage با زبان قدیمی می‌توانست مسیر /en را با UI فارسی و جهت RTL نشان دهد.

**وضعیت:** در PR اصلاح شده است: locale مسیر منبع حقیقت است و ذخیره‌سازی باید با آن همگام شود، نه اینکه URL را override کند. این رفتار هم در بارگذاری نخست و هم پس از navigation باید تست شود.

### 4.3 یافته معتبر: مسیر بدون locale هنگام تغییر زبان همگام نمی‌شد

**ریشه:** replacement اولیه فقط مسیرهای شروع‌شده با /fa یا /en را پوشش می‌داد؛ در مسیرهایی مانند /dashboard، state زبان تغییر می‌کرد اما URL بدون prefix باقی می‌ماند.

**وضعیت:** PR مسیرهای بدون prefix را از طریق proxy به locale پیش‌فرض هدایت می‌کند. تصمیم باید با آزمون مسیرهای واقعی، مسیر ناموجود، فایل‌ها، API و slugهایی مانند /apiary تأیید شود؛ نباید هر مسیر زیرساختی یا خارج از محصول به‌صورت کور به /fa هدایت شود.

### 4.4 یافته معتبر: برگشت سریع به مبدأ dock را برای مدت نامحدود مخفی می‌کرد

**ریشه:** timer بازیابی داخل effect وابسته به pathname قرار داشت و با اولین تغییر مسیر پاک می‌شد. در توالی A → B → A طی کمتر از ۳۰۰ میلی‌ثانیه، settle ممکن بود دیگر اجرا نشود و dock تا ناوبری بعدی مخفی بماند.

**وضعیت:** commit 767b5e01 تلاش کرده است مشاهده تغییر مسیر را با settlePath مستقل نگه دارد. ایده درست است، اما پیاده‌سازی به خطای lint رسیده و هنوز نهایی نیست.

### 4.5 شکست CI فعلی در head همان PR

GitHub Actions run: https://github.com/DiabloNova/oxenn/actions/runs/40762873739

- Isolation Suite: موفق
- Unit Tests: موفق
- Build and Test: ناموفق در مرحله Lint
- خطا: src/components/navigation/FloatingSidebar.tsx:176
- Rule: react-hooks/set-state-in-effect
- علت: اجرای هم‌زمان setSettlePath(pathname) داخل بدنه effect
- نتیجه: ۲۱۹ مشکل شامل ۱ error و ۲۱۸ warning؛ با pnpm lint --max-warnings=218 همان یک error باعث شکست می‌شود.
- هشدارهای مجاز، deprecation مربوط به Node و هشدارهای url/punycode علت اصلی شکست نیستند.

**نتیجه:** PR #98 در وضعیت فعلی آماده ادغام نیست. حذف ساده setSettlePath بدون جایگزین قابل قبول نیست، زیرا می‌تواند race قبلی را برگرداند.

## 5. راه‌حل پیشنهادی برای PR #98

### 5.1 اصلاح حداقلی و اصولی

1. شروع انتقال فقط از API مشترک navigation اعلام شود؛ Link، تغییر زبان، sidebar، topbar و Back/Forward پوشش داده شوند.
2. وضعیت انتقال شامل sourcePath، targetPath، phase و شناسه انتقال باشد؛ transition قدیمی نباید state انتقال جدید را پاک کند.
3. timerها در ref پایدار مدیریت شوند و عمرشان به تغییر pathname وابسته نباشد؛ unmount یا شروع انتقال جدید timer قبلی را پاک کند.
4. effect مربوط به pathname فقط زمان‌سنج را برنامه‌ریزی کند؛ بدنه synchronous آن نباید setState اجرا کند. state از event handler یا callback غیرهم‌زمان زمان‌سنج تغییر کند.
5. commit مسیر، بازگشت به مبدأ، no-op، timeout و انتقال جدید هرکدام مسیر state مشخص داشته باشند.
6. اگر مسیر تغییر نکرد یا انتقال شکست خورد، dock پس از مدت محدود بازیابی شود؛ نباید برای بازگشت به ظاهر به یک ناوبری بعدی وابسته بماند.
7. تغییر query/hash بدون تغییر pathname به‌تنهایی dock را مخفی نکند؛ تغییر locale یک pathname transition واقعی است و query/hash را حفظ کند.

### 5.2 جداسازی کار PR از redesign

برای PR #98 فقط خطای lint و invariantهای زبان/مسیر را اصلاح کنیم. معماری dock و کاربرد جدید آن در شاخه مستقل از main بررسی شود تا bug-fix زبان با redesign محصولی مخلوط نشود. پس از head جدید باید تمام gateهای آزمون سبز شوند؛ سپس با تأیید مالک محصول درباره بستن PR تصمیم گرفته شود.

## 6. کاربرد جدید پیشنهادی: Oxenn Twin Action Dock

### ایده مرکزی

نوار به **کنسول اقدام سریع بر پایه Digital Benchmark Twin** تبدیل شود. هویت آن ثابت است، اما اقدام‌های اصلی با توجه به صفحه جاری تغییر می‌کنند. command palette عمومی، جست‌وجوی مسیر/ابزار/اقدام را فراهم می‌کند.

### نسخه دسکتاپ

- **Twin Status Chip:** انتخاب Twin جاری، آخرین همگام‌سازی و تازگی داده.
- **Command/Search:** جست‌وجوی صفحه، ابزار، سند و اقدام؛ میانبر Ctrl/Cmd+K.
- **Compare:** مقایسه DBT با داده واقعی یا baseline.
- **Analyze Gaps:** اجرای DTGA یا بازکردن نتایج آخرین تحلیل.
- **Plan:** ساخت یا بازکردن برنامه اجرایی از gapهای تاییدشده.
- **Execute:** بازکردن صف برنامه‌ها و وضعیت اجرا؛ اجرای واقعی فقط با قابلیت و مجوز معتبر.
- **Context Action:** اقدام متناسب با صفحه، مانند اجرای ممیزی SEO یا مقایسه پاسخ مدل‌ها.
- **Progress:** وضعیت واقعی gapهای مهم یا وظایف معطل، نه اعلان یا شمارنده ساختگی.

### نسخه موبایل

یک dock جمع‌وجور با حداکثر سه اقدام اصلی: انتخاب Twin، command palette و اقدام زمینه‌ای. سایر گزینه‌ها در bottom sheet اسکرول‌پذیر باز شوند. focus، Escape، صفحه‌خوان، اندازه نقاط لمسی و reduced-motion باید طراحی شوند.

### رفتار وابسته به صفحه

| صفحه | اقدام‌های برجسته |
|---|---|
| داشبورد اصلی | انتخاب Twin، Compare، Analyze Gaps |
| DBT | منابع داده، مقایسه نسخه، تازگی داده |
| خروجی DTGA | اولویت‌بندی gap و ایجاد برنامه |
| گفت‌وگو با مدل‌ها | شروع گفت‌وگو، ذخیره مشاهده و مقایسه پاسخ |
| SEO/AEO/GEO | اجرای ممیزی، فرصت‌های بهینه‌سازی و برنامه مرتبط |
| برنامه اجرایی | ادامه برنامه، وابستگی‌ها و وضعیت اجرا |
| اجرای برنامه | ادامه/توقف فقط در صورتی که قابلیت و مجوز واقعی وجود داشته باشد |
| تنظیمات ابزارها | اتصال provider، وضعیت و مصرف |

قابلیت‌های planned یا in development باید وضعیت واقعی‌شان را نشان دهند و دکمه‌ای که کار نمی‌کند نباید ظاهراً عملیاتی باشد.

## 7. قرارداد state پیشنهادی

- Idle → Pending(sourcePath, targetPath, transitionId)
- Pending → Committed(newPath) → Settling → Idle
- Pending → Recovered (timeout، لغو یا انتقال ناموفق) → Idle
- Pending(A → B) → Pending(A → C)؛ انتقال جدید قبلی را supersede می‌کند.
- Pending(A → B) → Settling(A) اگر مسیر سریعاً به مبدأ برگردد؛ timer نباید گم شود.

Invariantها:
- URL و locale مسیر منبع حقیقت‌اند.
- فقط آخرین transitionId اجازه تغییر وضعیت جاری دارد.
- timeout به تغییر بعدی pathname وابسته نیست.
- event تکراری timer انتقال جدید را ناخواسته reset نمی‌کند.
- dock در مسیر عمومی خارج از WorkspaceShell mount نمی‌شود، نه اینکه صرفاً با CSS پنهان بماند.
- در فریم انتقال، هدف کلیک و focus نباید نامشخص باشد.

## 8. آزمون‌های اجباری

### زبان و مسیر
- fa ↔ en در خانه و صفحه داخلی
- localStorage مخالف locale URL
- حفظ pathname، query، hash و history semantics
- مسیر بدون prefix، ریشه، API، فایل و slug مشابه /apiary
- route ناموجود و notFound

### dock و انتقال
- Link، router.push/replace، تغییر زبان، sidebar، topbar و global back
- A → B و برگشت سریع B → A در کمتر از ۳۰۰ میلی‌ثانیه
- A → B → C و انتقال‌های پشت‌سرهم
- مقصد ناموجود یا pathname بدون تغییر
- timeout، unmount و mount دوباره shell
- query/hash-only، popstate، Back/Forward، external link، target blank، download و modified click
- خروج از workspace به صفحه عمومی و بازگشت
- آزمون کلیک‌پذیری در یک preview مجاز، نه فقط unit test

### Gates
- lint بدون error
- typecheck، unit، UI tests و isolation سبز
- proxy routing و locale tests سبز
- production build سبز
- GitHub Actions کامل سبز روی head نهایی
- گزارش task مطابق run واقعی به‌روز شود؛ هیچ آزمون دستی انجام‌نشده‌ای نباید موفق اعلام شود.

## 9. ترتیب اجرایی

1. PR #98 باز بماند؛ فعلاً merge یا close نشود.
2. شکست lint با حفظ آزمون برگشت سریع به مبدأ اصلاح شود.
3. همه test gates روی head جدید اجرا و بازخوردهای Cubic/Gitar تازه‌سازی شوند.
4. بعد از تایید مالک محصول درباره بستن PR #98 تصمیم گرفته شود.
5. در شاخه مستقل audit/floating-navigation-dock، معماری shell و Twin Action Dock بازبینی شود؛ پس از تصویب طراحی، implementation جدا آغاز شود.
6. route registry مرکزی با sitemap و service catalog هم‌راستا شود تا dock به مسیر نامعتبر یا placeholder عملیاتی وصل نشود.

## وضعیت نهایی

- PR #98 باز و ادغام‌نشده است و head بررسی‌شده در Lint شکست دارد.
- چند یافته قبلی Cubic/Gitar اصلاح شده‌اند، اما summary قدیمی Cubic جای بررسی head فعلی و CI را نمی‌گیرد.
- این شاخه از main جدا شده و فقط گزارش معماری دارد؛ کد اجرایی نوار تغییر نکرده است.
