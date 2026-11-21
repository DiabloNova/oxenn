"use client";

import { useMemo, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { saveUserIdentityProfileAction } from "@/app/actions/user-identity";
import { useUserWebsiteDirectory } from "@/components/features/dashboard/UserWebsiteDirectoryProvider";
import locationData from "@/data/middle-east-locations.json";

type WebsiteType = "official_website" | "ecommerce_store" | "social_network" | "marketplace" | "other";
type Website = { url: string; platformType: WebsiteType };
type LegalEntity = {
  companyName: string; brandName: string; legalType: string; registrationCountryCode: string; nationalId: string;
  industry: string; customIndustry: string; headquartersCountryCode: string; headquartersProvince: string; headquartersCity: string;
  representativePosition: string; representativeRelationship: string; representativePhoneNumber: string;
};
type Profile = {
  identityType: "individual" | "legal_entity"; firstName: string; lastName: string; gender: string; ageRange: string;
  jobTitle: string; customJobTitle: string; industry: string; customIndustry: string; phoneNumber: string;
  phoneVerified: boolean; smsNotificationsEnabled: boolean;
};
type InitialData = { account: { email: string; name: string }; profile: Profile; legalEntity: LegalEntity | null; websites: Array<{ id?: string; url: string; platformType: WebsiteType }> };
type Country = { code: string; fa: string; en: string; states: Array<{ code: string; name: string; cities: string[] }> };
const countries = (locationData as { countries: Country[] }).countries;
const jobs = [
  ["founder","بنیان‌گذار یا صاحب کسب‌وکار","Founder or business owner"],["ceo","مدیرعامل","Chief executive officer"],["marketing_manager","مدیر بازاریابی","Marketing manager"],["sales_manager","مدیر فروش","Sales manager"],["product_manager","مدیر محصول","Product manager"],["website_manager","مدیر وب‌سایت","Website manager"],["social_media_manager","مدیر شبکه‌های اجتماعی","Social media manager"],["social_seller","فروشنده در شبکه‌های اجتماعی","Social media seller"],["online_seller","فروشنده اینترنتی","Online seller"],["ecommerce_manager","مدیر فروشگاه اینترنتی","E-commerce manager"],["content_creator","تولیدکننده محتوا","Content creator"],["marketing_specialist","کارشناس بازاریابی","Marketing specialist"],["sales_specialist","کارشناس فروش","Sales specialist"],["business_consultant","مشاور کسب‌وکار","Business consultant"],["service_contractor","پیمانکار یا مجری خدمات","Service contractor"],["supplier","تأمین‌کننده کالا","Supplier"],["manufacturer","تولیدکننده","Manufacturer"],["trader","تاجر یا بازرگان","Trader or merchant"],["mining_professional","فعال حوزه معدن","Mining professional"],["other","سایر","Other"],
] as const;
const industries = [
  ["manufacturing","تولیدی و صنعتی","Manufacturing and industry"],["trade","بازرگانی و تجارت","Commerce and trade"],["mining","معدن و صنایع معدنی","Mining and mineral industries"],["agriculture","کشاورزی و دامپروری","Agriculture and livestock"],["services","خدمات","Services"],["technology","فناوری اطلاعات و نرم‌افزار","IT and software"],["ecommerce","فروش اینترنتی و تجارت الکترونیک","Online sales and e-commerce"],["social_commerce","فروش و بازاریابی شبکه‌های اجتماعی","Social media sales and marketing"],["education","آموزش","Education"],["healthcare","سلامت و بهداشت","Health and wellness"],["construction","ساختمان و املاک","Construction and real estate"],["logistics","حمل‌ونقل و لجستیک","Transport and logistics"],["tourism","گردشگری و هتلداری","Tourism and hospitality"],["finance","مالی و سرمایه‌گذاری","Finance and investment"],["media","رسانه و تبلیغات","Media and advertising"],["other","سایر","Other"],
] as const;
const ages = [["under_18","کمتر از ۱۸ سال","Under 18"],["18_24","۱۸ تا ۲۴ سال","18–24"],["25_34","۲۵ تا ۳۴ سال","25–34"],["35_44","۳۵ تا ۴۴ سال","35–44"],["45_54","۴۵ تا ۵۴ سال","45–54"],["55_64","۵۵ تا ۶۴ سال","55–64"],["65_plus","۶۵ سال و بیشتر","65 and over"]] as const;
const positions = [["ceo","مدیرعامل","Chief executive officer"],["board_member","عضو هیئت‌مدیره","Board member"],["senior_executive","مدیر ارشد","Senior executive"],["department_manager","مدیر واحد","Department manager"],["marketing_manager","مدیر بازاریابی","Marketing manager"],["sales_manager","مدیر فروش","Sales manager"],["employee","کارمند","Employee"],["legal_representative","نماینده قانونی","Legal representative"],["appointed_representative","نماینده معرفی‌شده","Appointed representative"],["other","سایر","Other"]] as const;
const relationships = [["director_or_member","مدیر یا عضو شرکت","Director or company member"],["employee","کارمند شرکت","Company employee"],["legal_representative","نماینده قانونی","Legal representative"],["appointed_representative","نماینده معرفی‌شده از سوی شرکت","Company-appointed representative"],["agency_contractor","شرکت تبلیغاتی یا مجری طرف قرارداد","Contracted agency or service provider"],["independent_consultant","مشاور مستقل","Independent consultant"],["other","سایر","Other"]] as const;
const websiteTypes = [["official_website","وب‌سایت رسمی","Official website"],["ecommerce_store","فروشگاه اینترنتی","Online store"],["social_network","شبکه اجتماعی","Social network"],["marketplace","بازارگاه اینترنتی","Online marketplace"],["other","سایر","Other"]] as const;
const legalTypes: Record<string, Array<[string,string,string]>> = {
  AE:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["private_joint_stock","شرکت سهامی خاص","Private joint-stock company"],["public_joint_stock","شرکت سهامی عام","Public joint-stock company"],["partnership","شرکت تضامنی یا مشارکت","Partnership"],["other","سایر","Other"]],
  BH:[["wll","شرکت با مسئولیت محدود","W.L.L."],["closed_shareholding","شرکت سهامی بسته","Closed shareholding company"],["public_shareholding","شرکت سهامی عام","Public shareholding company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  CY:[["private_limited","شرکت با مسئولیت محدود خصوصی","Private limited company"],["public_limited","شرکت سهامی عام","Public limited company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  EG:[["joint_stock","شرکت سهامی","Joint-stock company"],["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["partnership","مشارکت","Partnership"],["sole_proprietorship","مؤسسه انفرادی","Sole proprietorship"],["other","سایر","Other"]],
  IR:[["private_joint_stock","شرکت سهامی خاص","Private joint-stock company"],["public_joint_stock","شرکت سهامی عام","Public joint-stock company"],["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["general_partnership","شرکت تضامنی","General partnership"],["cooperative","شرکت تعاونی","Cooperative"],["institute","مؤسسه","Institute"],["other","سایر","Other"]],
  IQ:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["joint_stock","شرکت سهامی","Joint-stock company"],["general_partnership","شرکت تضامنی","General partnership"],["sole_proprietorship","کسب‌وکار انفرادی","Sole proprietorship"],["other","سایر","Other"]],
  IL:[["limited_company","شرکت با مسئولیت محدود","Limited company"],["public_company","شرکت سهامی عام","Public company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  JO:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["public_shareholding","شرکت سهامی عام","Public shareholding company"],["private_shareholding","شرکت سهامی خاص","Private shareholding company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  KW:[["wll","شرکت با مسئولیت محدود","W.L.L."],["closed_shareholding","شرکت سهامی بسته","Closed shareholding company"],["public_shareholding","شرکت سهامی عام","Public shareholding company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  LB:[["sarl","شرکت با مسئولیت محدود","SARL"],["sal","شرکت سهامی","SAL"],["snc","شرکت تضامنی","General partnership"],["other","سایر","Other"]],
  OM:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["saoc","شرکت سهامی بسته","SAOC"],["saog","شرکت سهامی عام","SAOG"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  PS:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["private_shareholding","شرکت سهامی خاص","Private shareholding company"],["public_shareholding","شرکت سهامی عام","Public shareholding company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  QA:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["qsc","شرکت سهامی خاص","QSC"],["qpsc","شرکت سهامی عام","QPSC"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  SA:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["joint_stock","شرکت سهامی","Joint-stock company"],["simplified_joint_stock","شرکت سهامی ساده","Simplified joint-stock company"],["general_partnership","شرکت تضامنی","General partnership"],["limited_partnership","شرکت مختلط غیرسهامی","Limited partnership"],["other","سایر","Other"]],
  SY:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["joint_stock","شرکت سهامی","Joint-stock company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
  TR:[["limited_company","شرکت با مسئولیت محدود","Limited company"],["joint_stock","شرکت سهامی","Joint-stock company"],["collective_company","شرکت تضامنی","Collective company"],["commandite","شرکت مختلط","Commandite company"],["cooperative","شرکت تعاونی","Cooperative"],["other","سایر","Other"]],
  YE:[["limited_liability","شرکت با مسئولیت محدود","Limited liability company"],["joint_stock","شرکت سهامی","Joint-stock company"],["partnership","مشارکت","Partnership"],["other","سایر","Other"]],
};
const emptyLegal: LegalEntity = { companyName:"",brandName:"",legalType:"",registrationCountryCode:"IR",nationalId:"",industry:"",customIndustry:"",headquartersCountryCode:"",headquartersProvince:"",headquartersCity:"",representativePosition:"",representativeRelationship:"",representativePhoneNumber:"" };
const fieldClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--sky-blue-500)] focus:ring-2 focus:ring-[var(--sky-blue-500)]/15 disabled:opacity-60";

export function UserIdentityForm({ initialData }: { initialData: InitialData }) {
  const { language, direction } = useTheme(); const isFa = language === "fa";
  const { refresh: refreshWebsiteDirectory } = useUserWebsiteDirectory();
  const [profile, setProfile] = useState<Profile>(initialData.profile);
  const [legal, setLegal] = useState<LegalEntity>({ ...emptyLegal, ...(initialData.legalEntity ?? {}) });
  const [websites, setWebsites] = useState<Website[]>(initialData.websites.map(({url,platformType})=>({url,platformType})));
  const [provinceKey,setProvinceKey] = useState(()=>{
    const entity=initialData.legalEntity; if(!entity) return "";
    const country=countries.find(c=>c.code===entity.headquartersCountryCode); const i=country?.states.findIndex(s=>s.name===entity.headquartersProvince) ?? -1;
    return country && i>=0 ? `${country.code}:${i}` : "";
  });
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState(false);
  const text=(fa:string,en:string)=>isFa?fa:en;
  const selectedProvince=useMemo(()=>{const [code,index]=provinceKey.split(":");const country=countries.find(c=>c.code===code);const state=country?.states[Number(index)];return country&&state?{country,state}:null;},[provinceKey]);
  const setP=<K extends keyof Profile>(key:K,value:Profile[K])=>setProfile(p=>({...p,[key]:value}));
  const setL=<K extends keyof LegalEntity>(key:K,value:LegalEntity[K])=>setLegal(p=>({...p,[key]:value}));
  const opts=(items:ReadonlyArray<readonly [string,string,string]>)=>items.map(([v,fa,en])=><option key={v} value={v}>{text(fa,en)}</option>);
  const save=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const payload={...profile,websites: websites.filter(w=>w.url.trim()),...(profile.identityType==="legal_entity"?{legalEntity:legal}:{})};
      const result=await saveUserIdentityProfileAction(payload);
      if(!result.success){const details=result.errorCode==="VALIDATION_ERROR"?Object.values(result.fieldErrors??{}).flat().filter(Boolean).join(" "):"";throw new Error(details||text("اطلاعات ذخیره نشد. موارد واردشده را بررسی کنید.","The profile could not be saved. Review the entered information."));}
      await refreshWebsiteDirectory();setError(false);setMessage(text("اطلاعات هویتی کاربر با موفقیت ذخیره شد.","User identity information was saved successfully."));
    }catch(err){setError(true);setMessage(err instanceof Error?err.message:text("خطای پیش‌بینی‌نشده رخ داد.","An unexpected error occurred."));}finally{setBusy(false);}
  };
  const input=(label:string,value:string,onChange:(v:string)=>void,required=false,props:InputHTMLAttributes<HTMLInputElement>={})=>(<label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{label}{required?" *":""}</span><input className={fieldClass} value={value} onChange={e=>onChange(e.target.value)} required={required} {...props}/></label>);
  const select=(label:string,value:string,onChange:(v:string)=>void,items:ReadonlyArray<readonly [string,string,string]>,required=false)=>(<label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{label}{required?" *":""}</span><select className={fieldClass} value={value} onChange={e=>onChange(e.target.value)} required={required}><option value="">{text("انتخاب کنید","Select")}</option>{opts(items)}</select></label>);

  return <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7" dir={direction}>
    <header className="space-y-2"><h2 className="text-xl font-black text-[var(--text-primary)]">{text("اطلاعات هویتی کاربر","User identity information")}</h2><p className="text-sm leading-7 text-[var(--text-muted)]">{text("این اطلاعات برای شناخت بهتر شما و کسب‌وکار یا شرکت مرتبط با فعالیتتان ثبت می‌شود و مبنای مشترک استفاده ابزارهای داشبورد خواهد بود.","This information helps Oxenn understand you and your business or company, and provides shared context for dashboard tools.")}</p></header>
    <form onSubmit={save} className="space-y-6">
      <fieldset className="space-y-3"><legend className="text-sm font-extrabold text-[var(--text-primary)]">{text("نوع هویت","Identity type")}</legend><div className="grid gap-3 sm:grid-cols-2">{([["individual","شخص حقیقی","Individual"],["legal_entity","شخص حقوقی","Legal entity"]] as const).map(([v,fa,en])=><label key={v} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-semibold"><input type="radio" name="identityType" checked={profile.identityType===v} onChange={()=>setP("identityType",v)}/>{text(fa,en)}</label>)}</div></fieldset>
      <fieldset className="space-y-4"><legend className="text-sm font-extrabold text-[var(--text-primary)]">{text("اطلاعات شخصی","Personal information")}</legend><div className="grid gap-4 md:grid-cols-2">
        {input(text("نام","First name"),profile.firstName,v=>setP("firstName",v),true,{maxLength:100})}
        {input(text("نام خانوادگی","Last name"),profile.lastName,v=>setP("lastName",v),true,{maxLength:100})}
        <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("جنسیت","Gender")} *</span><select className={fieldClass} required value={profile.gender} onChange={e=>setP("gender",e.target.value)}><option value="">{text("انتخاب کنید","Select")}</option><option value="male">{text("آقا","Male")}</option><option value="female">{text("خانم","Female")}</option></select></label>
        {select(text("بازه سنی","Age range"),profile.ageRange,v=>setP("ageRange",v),ages,true)}
        {select(text("شغل","Occupation"),profile.jobTitle,v=>setP("jobTitle",v),jobs,true)}
        {profile.jobTitle==="other"&&input(text("عنوان شغلی","Job title"),profile.customJobTitle,v=>setP("customJobTitle",v),true)}
        {select(text("زمینه شغلی","Industry"),profile.industry,v=>setP("industry",v),industries,true)}
        {profile.industry==="other"&&input(text("زمینه شغلی","Industry"),profile.customIndustry,v=>setP("customIndustry",v),true)}
      </div></fieldset>
      <fieldset className="space-y-4"><legend className="text-sm font-extrabold text-[var(--text-primary)]">{text("اطلاعات حساب و راه‌های ارتباطی","Account and contact details")}</legend><div className="grid gap-4 md:grid-cols-2">
        {input(text("ایمیل حساب کاربری","Account email"),initialData.account.email,()=>{},false,{readOnly:true,disabled:true,dir:"ltr"})}
        {input(text("شماره تلفن همراه","Mobile phone number"),profile.phoneNumber,v=>setP("phoneNumber",v),false,{type:"tel",inputMode:"tel",dir:"ltr",placeholder:"+98912xxxxxxx"})}
      </div><p className="text-xs text-[var(--text-muted)]">{text("شماره را همراه با پیش‌شماره کشور وارد کنید.","Include the international country calling code.")}</p>
      <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={profile.smsNotificationsEnabled} disabled={!profile.phoneVerified} onChange={e=>setP("smsNotificationsEnabled",e.target.checked)}/>{text("فعال‌سازی اعلان پیامکی","Enable SMS notifications")}</label>
      {!profile.phoneVerified&&<p className="text-xs leading-6 text-[var(--text-muted)]">{text("پس از تأیید شماره همراه، امکان فعال‌سازی اعلان پیامکی فراهم می‌شود. فعلاً شماره ذخیره می‌شود اما اعلان پیامکی فعال نخواهد شد.","SMS notifications can be enabled only after phone verification. The number can be saved now, but SMS notifications remain off until verification is available.")}</p>}</fieldset>
      {profile.identityType==="legal_entity"&&<fieldset className="space-y-5 border-t border-[var(--border)] pt-5"><legend className="text-sm font-extrabold text-[var(--text-primary)]">{text("اطلاعات شرکت","Company information")}</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {input(text("نام شرکت در آگهی تأسیس","Company name in incorporation notice"),legal.companyName,v=>setL("companyName",v),true)}
          {input(text("برند","Brand"),legal.brandName,v=>setL("brandName",v))}
          <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("کشور محل ثبت","Country of registration")} *</span><select className={fieldClass} required value={legal.registrationCountryCode} onChange={e=>{setL("registrationCountryCode",e.target.value);setL("legalType","");}}><option value="">{text("انتخاب کنید","Select")}</option>{countries.map(c=><option key={c.code} value={c.code}>{text(c.fa,c.en)}</option>)}</select></label>
          <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("نوع شخصیت حقوقی","Legal entity type")} *</span><select className={fieldClass} required value={legal.legalType} onChange={e=>setL("legalType",e.target.value)}><option value="">{text("انتخاب کنید","Select")}</option>{opts(legalTypes[legal.registrationCountryCode]??legalTypes.IR)}</select></label>
          {input(text("شناسه ملی","National identifier"),legal.nationalId,v=>setL("nationalId",v))}
          {select(text("زمینه فعالیت شرکت","Company industry"),legal.industry,v=>setL("industry",v),industries,true)}
          {legal.industry==="other"&&input(text("زمینه فعالیت شرکت","Company industry"),legal.customIndustry,v=>setL("customIndustry",v),true)}
        </div><p className="text-xs text-[var(--text-muted)]">{text("شناسه ملی را در صورتی وارد کنید که در کشور محل ثبت صادر می‌شود.","Enter the national identifier only if it is issued in the registration country.")}</p>
        <div className="space-y-3"><h3 className="text-sm font-bold text-[var(--text-primary)]">{text("دفتر مرکزی","Head office")}</h3><div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("استان یا منطقه","Province or region")} *</span><select className={fieldClass} required value={provinceKey} onChange={e=>{setProvinceKey(e.target.value);setL("headquartersProvince","");setL("headquartersCity","");setL("headquartersCountryCode","");}}><option value="">{text("ابتدا استان را انتخاب کنید","Select a province first")}</option>{countries.flatMap(c=>c.states.map((s,i)=>({country:c,state:s,index:i})).filter(item=>item.state.cities.length>0).map(({country,state,index})=><option key={`${country.code}:${index}`} value={`${country.code}:${index}`}>{text(`${state.name} — ${country.fa}`,`${state.name} — ${country.en}`)}</option>))}</select></label>
          <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("شهر","City")} *</span><select className={fieldClass} required disabled={!selectedProvince} value={legal.headquartersCity} onChange={e=>{setL("headquartersCity",e.target.value);if(selectedProvince)setL("headquartersCountryCode",selectedProvince.country.code);}}><option value="">{text("ابتدا استان را انتخاب کنید","Select a province first")}</option>{selectedProvince?.state.cities.map((city,i)=><option key={`${city}:${i}`} value={city}>{city}</option>)}</select></label>
          <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("کشور","Country")}</span><input className={fieldClass} readOnly disabled value={legal.headquartersCity&&selectedProvince?text(selectedProvince.country.fa,selectedProvince.country.en):""}/></label>
        </div></div>
        <div className="space-y-3"><h3 className="text-sm font-bold text-[var(--text-primary)]">{text("نماینده شرکت","Company representative")}</h3><div className="grid gap-4 md:grid-cols-2">
          {input(text("نام و نام خانوادگی نماینده","Representative full name"),`${profile.firstName} ${profile.lastName}`.trim(),()=>{},false,{readOnly:true,disabled:true})}
          {select(text("سمت در شرکت","Company position"),legal.representativePosition,v=>setL("representativePosition",v),positions,true)}
          {select(text("نوع ارتباط با شرکت","Relationship to company"),legal.representativeRelationship,v=>setL("representativeRelationship",v),relationships,true)}
          {input(text("شماره همراه نماینده (اختیاری)","Representative mobile (optional)"),legal.representativePhoneNumber,v=>setL("representativePhoneNumber",v),false,{type:"tel",dir:"ltr",placeholder:profile.phoneNumber||"+98912xxxxxxx"})}
        </div><p className="text-xs text-[var(--text-muted)]">{text("در صورت خالی بودن، شماره همراه ثبت‌شده در اطلاعات شخصی استفاده می‌شود.","If left blank, the mobile number in personal information is used.")}</p></div>
        <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-[var(--text-primary)]">{text("وب‌سایت‌ها و بسترهای فروش اینترنتی","Websites and online selling channels")}</h3><button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold" onClick={()=>setWebsites(w=>[...w,{url:"",platformType:"official_website"}])}>{text("افزودن آدرس وبسایت","Add website address")}</button></div>
          <p className="text-xs leading-6 text-[var(--text-muted)]">{text("در صورتی که محصولات یا خدمات شرکت شما از طریق وب‌سایت، فروشگاه‌های اینترنتی یا شبکه‌های اجتماعی عرضه می‌شوند، می‌توانید آدرس هرکدام را در این قسمت اضافه کنید. برای مثال، آدرس فروشگاه اینترنتی یا صفحه فروش محصولات در شبکه‌های اجتماعی نیز قابل ثبت است.","If your company's products or services are offered through websites, online stores or social networks, add each address here. For example, you can add your online store or product sales page on a social network.")}</p>
          {websites.map((website,i)=><div key={i} className="grid gap-3 rounded-xl border border-[var(--border)] p-3 md:grid-cols-[1fr_220px_auto]">
            {input(text("آدرس وب‌سایت یا صفحه فروش","Website or selling-page address"),website.url,v=>setWebsites(w=>w.map((item,j)=>j===i?{...item,url:v}:item)),false,{type:"url",dir:"ltr",placeholder:"https://example.com"})}
            <label className="block space-y-2"><span className="block text-xs font-bold text-[var(--text-secondary)]">{text("نوع بستر","Platform type")}</span><select className={fieldClass} value={website.platformType} onChange={e=>setWebsites(w=>w.map((item,j)=>j===i?{...item,platformType:e.target.value as WebsiteType}:item))}>{opts(websiteTypes)}</select></label>
            <div className="flex items-end"><button type="button" className="rounded-lg border border-rose-500/30 px-3 py-3 text-xs font-bold text-rose-500" onClick={()=>setWebsites(w=>w.filter((_,j)=>j!==i))}>{text("حذف","Remove")}</button></div>
          </div>)}
        </div>
      </fieldset>}
      {message&&<p role={error?"alert":"status"} aria-live={error?"assertive":"polite"} className={"rounded-xl border p-4 text-sm leading-6 "+(error?"border-rose-500/30 bg-rose-500/10 text-rose-400":"border-emerald-500/30 bg-emerald-500/10 text-emerald-400")}>{message}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-[var(--sky-blue-500)] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50 md:w-auto">{busy?text("در حال ذخیره‌سازی...","Saving..."):text("ذخیره اطلاعات هویتی","Save identity information")}</button>
    </form>
  </section>;
}
