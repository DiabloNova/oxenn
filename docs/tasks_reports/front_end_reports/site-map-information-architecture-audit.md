# ممیزی معماری اطلاعات و نقشه سایت Oxenn / Seorchable

- تاریخ بررسی: ۲۰۲۶-۱۰-۲۹
- شاخه ممیزی: `docs/site-map-and-product-information-architecture`
- شاخه مبنا: `main`
- commit مبنا: `0a85219c90ccba91d0f796dc6cdd344d84b6e003`
- نوع اقدام: بررسی و مستندسازی فقط؛ هیچ صفحه، مسیر برنامه یا رفتار اجرایی در این شاخه تغییر نکرده است.

## 1. تصمیم‌های معماری که باید رعایت شوند

1. «راهکارها و خدمات» فقط سطح معرفی، توضیح ارزش، مخاطب هدف، موارد استفاده، وضعیت عرضه و CTA است. کار واقعی با ابزارها در داشبورد انجام می‌شود.
2. همه ابزارهای رایگان و پولی در یک **کاتالوگ خدمات داشبورد** فهرست می‌شوند؛ تفکیک رایگان/پولی با فیلتر، برچسب و مجوز انجام می‌شود، نه با چند مرکز ابزار مجزا.
3. SEO، AEO و GEO خانواده‌های محصول/ابزار در داشبورد هستند؛ صفحه عمومی آن‌ها فقط معرفی و هدایت به داشبورد است.
4. Digital Benchmark Twin (DBT) هسته مدل‌سازی و مقایسه برند/وب‌سایت/حضور واقعی با دوقلوی دیجیتال است.
5. موتور تحلیل فاصله میان وضعیت واقعی و DBT با نام پیشنهادی **Digital Twin Gap Analyzer (DTGA)** و نام فارسی «تحلیل‌گر شکاف دوقلوی دیجیتال» ارائه می‌شود. این نام، نقش ابزار را از یک پردازشگر مبهم به یک قابلیت قابل سنجش روشن می‌کند.
6. خدمات زیرساخت مدل‌های زبانی و ابزارهای هوش مصنوعی یک خانواده محصول مستقل با صفحه معرفی عمومی و فضای مدیریت متناظر در داشبورد خواهند داشت.
7. برای هر قابلیت «موجود»، «در حال توسعه» یا «برنامه‌ریزی‌شده» صفحه یا مقصد مشخص و پیوند قابل مشاهده وجود دارد. صفحه‌های برنامه‌ریزی‌شده باید وضعیت عرضه را صریح اعلام کنند و نباید وانمود کنند که قابلیت عملیاتی است.
8. نقشه معماری و ناوبری با XML sitemap یکی نیست. هر دو لازم‌اند، اما sitemap موتور جست‌وجو فقط URLهای عمومیِ آماده ایندکس را می‌گیرد.

## 2. نتیجه ممیزی وضعیت فعلی مخزن

### 2.1 مسیرهای موجود

از درخت مخزن در commit مبنا، ۵۸ فایل صفحه‌ای در `src/app/[locale]` شناسایی شد: ۳۴ مسیر داشبورد و ۲۴ مسیر غیر‌داشبورد. شمارش مسیرها اثبات پیاده‌سازی کامل یا آماده‌بودن تجاری هر قابلیت نیست؛ فقط وجود route/file را تأیید می‌کند.

**صفحات عمومی فعلی**
- خانه: `/[locale]`
- قابلیت‌ها: `/[locale]/features`
- راهکارها: `/[locale]/solutions`
- معرفی‌های راهکار: `/[locale]/solutions/aeo`, `/[locale]/solutions/geo`, `/[locale]/solutions/protection`, `/[locale]/solutions/radar`
- صنایع: `/[locale]/industries`
- تعرفه: `/[locale]/pricing`
- درباره ما: `/[locale]/about`
- تماس: `/[locale]/contact`
- منابع: `/[locale]/resources`
- وبلاگ: `/[locale]/blog`
- مستندات: `/[locale]/docs` و `/[locale]/docs/[slug]`
- حریم خصوصی: `/[locale]/privacy`

**ورود، حساب و صفحات عملیاتی**
- `/[locale]/login`
- `/[locale]/register`
- `/[locale]/forgot-password`
- `/[locale]/verify-email`
- `/[locale]/profile`
- `/[locale]/settings`
- `/[locale]/invoice`
- `/[locale]/design-system/tokens`

**مسیرهای داشبورد فعلی**
- نمای کلی: `/dashboard`
- AEO: `/dashboard/aeo/audits`, `/dashboard/aeo/content`, `/dashboard/aeo/playground`
- تحلیل‌ها: `/dashboard/analytics`, `/dashboard/analytics/llm`, `/dashboard/analytics/llm-bias`
- ممیزی: `/dashboard/audits`, `/dashboard/audits/[id]`, `/dashboard/audit/free`, `/dashboard/audit/premium`
- برند و استناد: `/dashboard/brand-monitoring`, `/dashboard/brand/citations`
- رقبا: `/dashboard/competitive`, `/dashboard/competitors`, `/dashboard/competitors/radar`
- محتوا: `/dashboard/content`, `/dashboard/content/studio`, `/dashboard/content/ingestion`
- دانش و داده: `/dashboard/entities`, `/dashboard/entities/graph`, `/dashboard/graph`, `/dashboard/ingest`, `/dashboard/ingestion`, `/dashboard/intelligence`, `/dashboard/query`, `/dashboard/rag`
- SEO فنی و طرح‌واره: `/dashboard/seo/technical`, `/dashboard/seo/schema`, `/dashboard/optimization/technical`
- سایر: `/dashboard/services`, `/dashboard/reports`, `/dashboard/billing`, `/dashboard/settings`

### 2.2 وضعیت واقعی sitemap

در درخت شاخه مبنا، route یا فایل اجرایی برای `sitemap.xml` / `src/app/sitemap.ts` و نیز route اجرایی `robots.txt` / `src/app/robots.ts` پیدا نشد. سند `docs/architecture/SITEMAP_AND_ROUTE_SPECIFICATION.md` موجود است، اما خودش تصریح می‌کند که blueprint برنامه‌ریزی است و قرار نیست در آن task کد برنامه تغییر کند؛ بنابراین وجودش به معنی وجود sitemap فعال نیست.

در نتیجه، **sitemap اجرایی در مخزن تأیید نشده است**. قبل از پیاده‌سازی XML sitemap باید canonical routeها، redirectها، وضعیت صفحه‌ها، localeها و سیاست noindex نهایی شوند.

### 2.3 ایرادهای مشاهده‌شده که بر نقشه اثر می‌گذارند

- فهرست ناوبری در چند جا مستقلاً تعریف شده و مقصدهای هم‌نام همیشه به صفحه درست نمی‌رسند.
- چند مسیر قدیمی داشبورد به‌جای redirect، کامپوننت مسیر دیگری را دوباره render می‌کنند؛ مانند `/dashboard/rag`, `/dashboard/ingest`, `/dashboard/graph` و `/dashboard/competitors`.
- `/settings` در سند معماری به پروفایل قابل redirect معرفی شده، اما کد صفحه فعلی مستقل است؛ تصمیم canonical باید اجرایی شود.
- footer صفحاتی مثل «Careers»، «Case Studies»، «Industry Benchmarks» و «Changelog & Roadmap» را به مقصدهای عمومی و کلی هدایت می‌کند، نه صفحات اختصاصی.
- چند slug لینک مستندات با `DOCS_INDEX` تطبیق دقیق ندارند. قبل از sitemap باید لینک‌ها از registry واقعی ساخته شوند و هر slug در build/test اعتبارسنجی شود.
- metadata عمومی در locale layout برای همه صفحات به‌صورت ثابت نوشته شده و عنوان/description اختصاصی و hreflang/canonical سراسری برای همه صفحات اثبات نشده است.
- ابزار رایگان در صفحه خانه anchor دارد، اما کاتالوگ یکپارچه ابزارهای رایگان و پولی در داشبورد وجود ندارد.
- مسیرهای اختصاصی داشبورد برای DBT، تحلیل شکاف، ساخت برنامه اجرایی، اجرای برنامه و چت چندمدلی در inventory فعلی پیدا نشدند.
- صفحه مستقل خدمات سازمانی و صفحه دموی داشبورد نیز در inventory فعلی وجود ندارند.
- `/privacy` به‌تنهایی برای تفکیک صفحه حریم خصوصی، شرایط استفاده، سیاست کوکی و شرایط خدمات کافی نیست؛ باید محتوا و URLهای canonical از هم تفکیک شوند.

## 3. نقشه سطح اول پیشنهادی

ساختار ناوبری عمومی مطابق درخواست مالک محصول:

1. **خانه** — `/[locale]`
2. **قابلیت‌ها** — `/[locale]/features`: ارزش و کاربرد قابلیت‌ها به تفکیک نوع مشتری/مارکت هدف، بدون اجرای ابزار
3. **راهکارها و خدمات** — `/[locale]/solutions`: کاتالوگ معرفی همه سرویس‌ها و ابزارها، همراه وضعیت عرضه و لینک به ابزار متناظر داخل داشبورد
4. **خدمات سازمانی** — `/[locale]/enterprise` (پیشنهادی، مسیر جدید): زیرساخت مدل‌های زبانی، API inference/serving، زیرساخت ابزارهای AI، استقرار، امنیت، کنترل دسترسی، مشاهده‌پذیری، قرارداد/SLA و درخواست مشاوره
5. **تعرفه خدمات** — `/[locale]/pricing`
6. **درباره ما** — `/[locale]/about`
7. **تماس با ما** — `/[locale]/contact`
8. **مستندات** — `/[locale]/docs`
9. **وبلاگ** — `/[locale]/blog`
10. **قوانین و مقررات** — `/[locale]/legal` (پیشنهادی، مسیر جدید) با پیوندهای جداگانه به `/privacy`, `/terms` و در صورت نیاز `/cookies`
11. **ورود / ثبت‌نام** — `/[locale]/login` و `/[locale]/register`
12. **دموی داشبورد** — `/[locale]/demo` (پیشنهادی، مسیر جدید؛ دموی امن با داده نمونه و بدون افشای اطلاعات واقعی)
13. **خدمات رایگان** — CTA به کاتالوگ متمرکز `/[locale]/dashboard/tools?access=free` با ورود/ثبت‌نام رایگان یا دسترسی محدود مهمانِ کنترل‌شده

**Product** به‌عنوان دسته محصول در معماری محتوا حفظ می‌شود و بخش جداگانه زیرساخت هوش مصنوعی زیر آن قرار می‌گیرد؛ برای جلوگیری از شلوغی navbar، دسترسی به صفحات جزئی از منوی «خدمات سازمانی» و hub محصولات امکان‌پذیر است:
- `/[locale]/product` — نمای کلی خانواده محصولات
- `/[locale]/product/llm-infrastructure` — زیرساخت سرو و اجرای مدل‌های زبانی
- `/[locale]/product/ai-tooling` — پلتفرم/ابزارهای AI و مدیریت اتصال ابزارها
- `/[locale]/product/api-platform` — API، کلیدها، سهمیه، هزینه و مستندات توسعه‌دهندگان

این صفحات عمومی فقط توضیح می‌دهند و CTA می‌دهند؛ سرویس واقعی از داشبورد/کنسول سازمانی مصرف می‌شود.

## 4. دسته‌بندی کامل خدمات در راهکارها و داشبورد

قاعده: هر ردیف زیر باید یک صفحه معرفی عمومی با لینک به یک route داشبورد داشته باشد. اگر route ابزار هنوز آماده نیست، route مقصد ساخته شود و صفحه به‌روشنی برچسب «در حال توسعه» یا «برنامه‌ریزی‌شده» بگیرد. route برنامه‌ریزی‌شده نباید نتیجه ساختگی یا دکمه عملیاتی غیرواقعی ارائه دهد.

### 4.1 هسته Digital Benchmark Twin و gap analysis

| خدمت | صفحه معرفی عمومی | ابزار متمرکز داشبورد | وضعیت در inventory فعلی |
|---|---|---|---|
| Digital Benchmark Twin (DBT) | `/solutions/digital-benchmark-twin` | `/dashboard/twin` | برنامه‌ریزی‌شده؛ route فعلی پیدا نشد |
| منابع داده و مدل برند/وب‌سایت | `/solutions/brand-data-ingestion` | `/dashboard/twin/sources` | بخشی از ingest موجود است؛ تطبیق DBT لازم |
| مقایسه داده واقعی با DBT | `/solutions/twin-comparison` | `/dashboard/twin/compare` | برنامه‌ریزی‌شده |
| تحلیل‌گر شکاف دوقلوی دیجیتال (DTGA) | `/solutions/digital-twin-gap-analyzer` | `/dashboard/twin/gaps` | برنامه‌ریزی‌شده |
| اولویت‌بندی شکاف‌ها و فرصت‌ها | `/solutions/gap-prioritization` | `/dashboard/twin/opportunities` | برنامه‌ریزی‌شده |

### 4.2 جست‌وجو و مدل‌های هوش مصنوعی

| خدمت | صفحه معرفی عمومی | ابزار متمرکز داشبورد | وضعیت در inventory فعلی |
|---|---|---|---|
| گفت‌وگو با مدل‌های هوش مصنوعی | `/solutions/ai-model-chat` | `/dashboard/ai/chat` | مسیر عمومی چت اختصاصی پیدا نشد؛ Query/RAG موجود است اما معادل خودکار چت چندمدلی نیست |
| آزمایش/مقایسه مدل‌ها و prompt | `/solutions/model-evaluation` | `/dashboard/ai/model-lab` | بخشی از prompt playground موجود؛ دامنه نهایی باید تثبیت شود |
| Prompt/query monitoring | `/solutions/prompt-monitoring` | `/dashboard/ai/prompts` | مسیرهای query/playground موجود؛ canonicalization لازم |
| تحلیل پاسخ و استناد مدل‌ها | `/solutions/ai-visibility` | `/dashboard/aeo/audits` و `/dashboard/brand/citations` | routeها موجود؛ تکمیل وضعیت عملکردی لازم |
| هوشمندی رقابتی | `/solutions/competitive-intelligence` | `/dashboard/competitors/radar` | مسیرهای مشابه موجود؛ canonical route واحد لازم |

### 4.3 SEO، AEO و GEO — همه داخل داشبورد

| خانواده/خدمت | صفحه معرفی عمومی | ابزار متمرکز داشبورد | وضعیت در inventory فعلی |
|---|---|---|---|
| SEO overview و ابزارها | `/solutions/seo` | `/dashboard/seo` | hub اختصاصی پیشنهاد می‌شود؛ زیرصفحات فنی/schema موجود |
| Technical SEO audit | `/solutions/technical-seo` | `/dashboard/seo/technical` | صفحات ابزار موجود |
| Schema و structured data | `/solutions/structured-data` | `/dashboard/seo/schema` | ابزار موجود |
| AEO | `/solutions/aeo` | `/dashboard/aeo` و زیرصفحات audits/content/playground | زیرصفحات موجود؛ hub باید روشن شود |
| AEO content intelligence | `/solutions/aeo-content` | `/dashboard/aeo/content` | route موجود |
| GEO | `/solutions/geo` | `/dashboard/geo` | route داشبوردی اختصاصی در inventory فعلی پیدا نشد |
| تحلیل رقابت/سهم صدا | `/solutions/brand-visibility-analytics` | `/dashboard/analytics/llm` | route موجود؛ روابط منو باید یکپارچه شود |
| تولید/بهینه‌سازی محتوا | `/solutions/content-optimization` | `/dashboard/content/studio` | route موجود |
| ingest محتوا و اسناد | `/solutions/knowledge-ingestion` | `/dashboard/content/ingestion` | route موجود؛ مسیرهای قدیمی ingest باید redirect شوند |
| گراف دانش و موجودیت‌ها | `/solutions/knowledge-graph` | `/dashboard/entities/graph` | route موجود؛ aliasهای graph باید canonical شوند |
| گزارش‌های مدیریتی | `/solutions/executive-reporting` | `/dashboard/reports` | route موجود |

### 4.4 برنامه‌ریزی و اجرای عمل

| قابلیت | صفحه معرفی عمومی | ابزار متمرکز داشبورد | وضعیت در inventory فعلی |
|---|---|---|---|
| ساخت برنامه اجرایی اولویت‌بندی‌شده | `/solutions/execution-planning` | `/dashboard/plans` | برنامه‌ریزی‌شده؛ route پیدا نشد |
| جزئیات، وابستگی‌ها و معیار موفقیت برنامه | `/solutions/action-plan-management` | `/dashboard/plans/[planId]` | برنامه‌ریزی‌شده |
| اجرای برنامه و گردش کار | `/solutions/plan-execution` | `/dashboard/executions` | برنامه‌ریزی‌شده |
| رصد وضعیت وظایف و نتایج | `/solutions/optimization-tracking` | `/dashboard/executions/[runId]` | برنامه‌ریزی‌شده |
| تنظیمات ابزارها و اتصال‌ها | `/solutions/ai-tool-configuration` | `/dashboard/settings/tools` | تنظیمات کلی موجود؛ صفحه اختصاصی ابزارها پیدا نشد |

### 4.5 زیرساخت مدل و ابزارهای هوش مصنوعی (Product / Enterprise)

| محصول | صفحه عمومی Product | کنسول داشبورد | وضعیت در inventory فعلی |
|---|---|---|---|
| LLM serving / inference infrastructure | `/product/llm-infrastructure` | `/dashboard/enterprise/llm-infrastructure` | محصول عمومی و کنسول اختصاصی پیدا نشد |
| AI tool runtime / tool registry | `/product/ai-tooling` | `/dashboard/enterprise/ai-tools` | محصول عمومی و کنسول اختصاصی پیدا نشد |
| API platform و کلیدهای دسترسی | `/product/api-platform` | `/dashboard/developer/api-keys` | بعضی endpointهای API موجودند؛ صفحه کنسول محصول باید بررسی/تکمیل شود |
| provider/model configuration | `/product/model-management` | `/dashboard/settings/models` | باید با وضعیت پیکربندی واقعی providerها تطبیق داده شود |
| مصرف، هزینه و quota | `/product/usage-governance` | `/dashboard/enterprise/usage` | billing موجود؛ تجمیع API/AI usage نیازمند بررسی است |
| امنیت، دسترسی، audit و SLA | `/enterprise/security-and-governance` | `/dashboard/enterprise/security` | صفحه محصول و کنسول اختصاصی پیدا نشد |

### 4.6 خدمات فرعی و زیرساختی داشبورد

تمام این موارد باید در کاتالوگ متمرکز داشبورد قابل کشف باشند:
- نمای کلی workspace؛
- catalog با فیلتر «رایگان / پولی / در دسترس برای طرح من / در حال توسعه / برنامه‌ریزی‌شده»؛
- مدیریت برند، سایت، workspace و منابع ورودی؛
- رقبا، استنادها، analytics و گزارش‌ها؛
- تنظیمات کاربری و workspace، تنظیمات ابزارها و providerها؛
- اشتراک، billing، quota، usage و API keys؛
- مستندات مرتبط با هر ابزار و کمک درون‌محصولی.

صفحات موجود در این بخش در حال حاضر شامل `/dashboard`, `/dashboard/services`, `/dashboard/settings`, `/dashboard/billing`, `/dashboard/reports`, `/dashboard/brand-monitoring`, `/dashboard/brand/citations`, `/dashboard/analytics/*` هستند. وجود مسیر، تکمیل کارکرد را اثبات نمی‌کند؛ از جمله صفحه عمومی تنظیمات فعلی متن «در دست توسعه» نشان می‌دهد.

## 5. معماری منوها و مالکیت صفحه

- **منوی عمومی** فقط مسیرهای عمومی سطح یک و معرفی محصول را دارد.
- **Solutions** برای هر سرویس یک کارت/صفحه معرفی دارد؛ CTA آن به route ابزار داخل Dashboard می‌رود.
- **Product / Enterprise** زیرساخت مدل‌های زبانی و ابزارهای AI را معرفی می‌کند و به کنسول سازمانیِ داشبورد وصل می‌شود.
- **Dashboard Service Catalog** تنها نقطه کشف و اجرای ابزارهای رایگان و پولی است. داشبورد منوی دسته‌بندی‌شده و جست‌وجوی سراسری دارد و وضعیت هر قابلیت از registry مرکزی می‌آید.
- مسیرهای احراز هویت جدا از shell بازاریابی و shell فضای کاری هستند.
- یک registry واحد باید route، عنوان فارسی/انگلیسی، توضیح، طبقه محصول، دسترسی، وضعیت توسعه، canonical route و target داشبورد را تعریف کند؛ navbar، footer، catalog و sitemap از همان registry مشتق شوند.
- مسیرهای alias یا redirect می‌شوند یا تا زمان مهاجرت با canonical URL صریح معرفی می‌شوند؛ نباید چند صفحه هم‌محتوا در sitemap قرار گیرند.

## 6. سیاست وضعیت عرضه و SEO

سه وضعیت محتوا/عرضه باید استاندارد شوند:

- **موجود (Available):** صفحه معرفی، مستندات استفاده، CTA معتبر و route داشبورد عملیاتی دارد. فقط در این وضعیت، پس از تأیید SEO، امکان قرار گرفتن در sitemap عمومی وجود دارد.
- **در حال توسعه (In development):** صفحه و لینک دارد، وضعیت و محدوده قابل استفاده/غیرقابل استفاده را مشخص می‌کند، CTA اجرای قابلیت را disabled یا ثبت علاقه‌مندی می‌کند و وعده عملیاتی نادرست نمی‌دهد. تا وقتی محتوای ارزشمند و هدف جست‌وجویی ندارد، noindex می‌ماند.
- **برنامه‌ریزی‌شده (Planned):** صفحه معرفی شفاف، مسئله‌ای که حل می‌کند، مخاطب، وضعیت، و لینک بازگشت/درخواست دسترسی دارد. route در نقشه معماری و منو ثبت می‌شود، اما نباید در XML sitemap ایندکس‌پذیر وارد شود تا صفحه ارزشمند واقعی آماده باشد.

برای localeها:
- هر صفحه عمومی باید عنوان، توضیح و محتوا را با locale URL تطبیق دهد.
- canonical هر صفحه باید به نسخه غیرپارامتری و درست همان زبان اشاره کند؛ UTM و queryهای جست‌وجو URL ایندکس‌پذیر جدید تولید نکنند.
- `hreflang=en`, `hreflang=fa` و `x-default` فقط بین ترجمه‌های متناظر واقعی درج شوند.
- مسیرهای dashboard، account، invoice، demo خصوصی و ابزارهای اجرایی باید مطابق سیاست دسترسی و noindex مدیریت شوند؛ مسیر API و فایل‌ها نباید به‌عنوان صفحات محتوایی sitemap تولید شوند.
- sitemap XML باید فقط routeهای canonical عمومی و مجاز به ایندکس را تولید کند؛ sitemap عمومی جایگزین نقشه کامل محصول نیست.

## 7. ساختار پیشنهادی اجرای کار

1. تصویب معماری اطلاعات فوق و تصمیم درباره نام‌ها و routeهای canonical.
2. ساخت route registry مرکزی شامل تمام قابلیت‌های موجود، در حال توسعه و برنامه‌ریزی‌شده.
3. همسان‌سازی navbar، footer، catalog داشبورد و لینک‌های مستندات با registry.
4. ساخت صفحه‌های جدید/مقصدهای داشبورد برای DBT، DTGA، چت مدل‌ها، برنامه‌ریزی و اجرای برنامه و خدمات زیرساختی؛ هر صفحه با وضعیت عرضه واقعی.
5. انتقال همه ابزارهای رایگان و پولی به catalog داشبورد و ایجاد demo مستقل با داده نمونه.
6. اجرای redirectهای canonical، حذف یا alias کردن routeهای تکراری و آزمون تمام پیوندها.
7. پیاده‌سازی metadata اختصاصی، canonical/hreflang، robots و XML sitemap پویا.
8. آزمون خودکار: route existence، link target existence، locale parity، status badge correctness، noindex boundaries، duplicate/canonical route، sitemap inclusion/exclusion و accessibility منو.
9. آزمون مرورگر فارسی/انگلیسی و تم روشن/تاریک در viewport موبایل و دسکتاپ.

## 8. معیارهای پذیرش

- هر خدمت/ابزار در registry مرکزی، صفحه معرفی عمومی و مقصد مشخص داشبورد دارد.
- هر ابزار با وضعیت Planned یا In development همین وضعیت را به زبان فعلی کاربر نشان می‌دهد.
- همه ابزارهای رایگان/پولی از Dashboard Service Catalog قابل پیدا کردن هستند؛ صفحه public صرفاً معرفی یا دمو است.
- ابزارهای SEO/AEO/GEO در فضای کاری داشبورد سازمان‌دهی شده‌اند، نه به‌عنوان محل اجرای کار در بخش public Solutions.
- زیرساخت LLM و AI tooling یک بخش مستقل Product/Enterprise با صفحات معرفی و کنسول داشبوردی دارد.
- هیچ مقصد منو به صفحه نامرتبط، slug نامعتبر یا alias بدون سیاست canonical منتهی نمی‌شود.
- sitemap اجرایی از registry ساخته می‌شود و مسیرهای خصوصی، aliasها، routeهای planned و صفحات کم‌محتوا را ایندکس نمی‌کند.
- فارسی و انگلیسی برای تمام صفحات عمومی و داشبورد از نظر مسیر، title, description, direction، لینک مقصد و تم روشن/تاریک تست شده‌اند.

**وضعیت این سند:** نتیجه ممیزی و پیشنهاد معماری است؛ هیچ route، sitemap، redirect یا UI در این شاخه پیاده‌سازی نشده است.
