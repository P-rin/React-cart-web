type StoreLandingPageProps = {
  onShopNow: () => void
  onLogin: () => void
  accountLabel?: string
}

const storeInfo = {
  name: 'Nimman Corner',
  phone: '081-234-5678',
  address: '44/2 ถ.นิมมานเหมินท์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200',
}

export default function StoreLandingPage({ onShopNow, onLogin, accountLabel = 'เข้าสู่ระบบ' }: StoreLandingPageProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-[#102923] text-white shadow-2xl shadow-slate-900/10">
      <div className="grid min-h-[520px] lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative flex flex-col justify-between px-7 py-8 sm:px-12 sm:py-10 lg:px-16 lg:py-14">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-[#d8f46a]/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-5">
            <a href="#storefront" className="flex items-center gap-3 text-white no-underline" aria-label="หน้าแรก Nimman Corner">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d8f46a] text-xl font-bold text-[#102923]">N</span>
              <span className="text-lg font-semibold tracking-wide">{storeInfo.name}</span>
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onShopNow}
                className="hidden rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:block"
              >
                ดูสินค้าทั้งหมด
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#102923] transition hover:bg-[#d8f46a]"
              >
                {accountLabel}
              </button>
            </div>
          </div>

          <div className="relative max-w-xl py-14 lg:py-8">
            <p className="mb-5 inline-flex rounded-full border border-[#d8f46a]/30 bg-[#d8f46a]/10 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#d8f46a]">
              CURATED GOODS · CHIANG MAI
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-[72px]">
              ของดีที่คัดมา<br />เพื่อทุกวันของคุณ
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/68 sm:text-lg">
              เลือกของใช้ดี ๆ ของฝากน่ารัก และของขวัญพิเศษจากร้าน Nimman Corner
              คัดสรรด้วยใจ ส่งตรงถึงบ้านคุณ
            </p>
            <button
              type="button"
              onClick={onShopNow}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#d8f46a] px-6 py-3.5 font-semibold text-[#102923] transition hover:-translate-y-0.5 hover:bg-[#e4ff83]"
            >
              เลือกซื้อสินค้า
              <span aria-hidden="true" className="text-xl">↗</span>
            </button>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[#e9e2d7] lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(216,244,106,.85),transparent_27%),linear-gradient(145deg,#ddd5c7,#b9c5af)]" />
          <div className="absolute -left-10 bottom-[-18%] h-[520px] w-[520px] rounded-full border-[72px] border-[#f7f1e8]/80" />
          <div className="absolute right-[14%] top-[18%] grid h-36 w-36 rotate-6 place-items-center rounded-[2rem] bg-[#fffaf1] shadow-2xl shadow-slate-700/20">
            <div className="h-20 w-20 rounded-full border-[12px] border-[#d8f46a] bg-[#102923] shadow-[0_0_0_9px_rgba(16,41,35,.12)]" />
          </div>
          <div className="absolute bottom-[12%] left-[12%] w-[74%] rounded-[1.75rem] bg-[#fffdf8]/95 p-5 text-[#102923] shadow-xl backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[.18em] text-[#667168]">NIMMAN EDIT</p>
                <p className="mt-2 text-xl font-semibold">ค้นพบของดีใกล้บ้าน</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#102923] text-lg text-white">✦</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid border-t border-white/10 bg-[#0d221d] sm:grid-cols-3">
        <div className="border-b border-white/10 px-7 py-6 sm:border-b-0 sm:border-r sm:px-10">
          <p className="text-xs font-semibold tracking-[.16em] text-white/45">ร้านค้า</p>
          <p className="mt-2 font-semibold">{storeInfo.name}</p>
        </div>
        <div className="border-b border-white/10 px-7 py-6 sm:border-b-0 sm:border-r sm:px-10">
          <p className="text-xs font-semibold tracking-[.16em] text-white/45">ติดต่อ</p>
          <a href={`tel:${storeInfo.phone.replaceAll('-', '')}`} className="mt-2 block font-semibold text-white no-underline">{storeInfo.phone}</a>
        </div>
        <div className="px-7 py-6 sm:px-10">
          <p className="text-xs font-semibold tracking-[.16em] text-white/45">ที่ตั้ง</p>
          <p className="mt-2 text-sm leading-6 text-white/85">{storeInfo.address}</p>
        </div>
      </div>
    </section>
  )
}
