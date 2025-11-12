import imgCogwheel1 from "figma:asset/b6d2c40f26f3843ff4045493da4aa97b579be354.png";
import imgShiled1 from "figma:asset/894eeb725e3af1b2781d740ac818f39f2b068c38.png";
import imgUser21 from "figma:asset/2a6be4c3de4d5556a3e0ac52266d32655e3c6725.png";

function Group() {
  return (
    <div className="absolute contents left-[499px] top-[307px]">
      <div className="absolute bg-white h-[329px] left-[878px] rounded-[10px] top-[307px] w-[283px]" />
      <div className="absolute bg-white h-[329px] left-[499px] rounded-[10px] top-[307px] w-[283px]" />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[499px] top-[307px]">
      <Group />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[205px] top-[58px]">
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[250px] text-[30px] text-nowrap text-white top-[58px] whitespace-pre">LYCEUM OF THE PHILIPPINES UNIVERSITY - CAVITE</p>
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[469px] text-[30px] text-nowrap text-white top-[110px] whitespace-pre">IT HELPDESK SYSTEM</p>
      <Group1 />
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[205px] text-[25px] text-[rgba(139,0,0,0.7)] text-nowrap top-[459px] whitespace-pre">FACULTY</p>
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[912px] text-[25px] text-[rgba(139,0,0,0.7)] text-nowrap top-[459px] whitespace-pre">ADMINISTRATOR</p>
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[578px] text-[25px] text-[rgba(139,0,0,0.7)] text-nowrap top-[459px] whitespace-pre">ICT STAFF</p>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[205px] top-[58px]">
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents left-[205px] top-[58px]">
      <Group3 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents left-[205px] top-[58px]">
      <Group4 />
      <div className="absolute left-[955px] size-[129px] top-[323px]" data-name="cogwheel 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgCogwheel1} />
      </div>
      <div className="absolute left-[578px] size-[115px] top-[330px]" data-name="shiled 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgShiled1} />
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents left-[151px] top-[572px]">
      <div className="absolute bg-[rgba(139,0,0,0.7)] h-[40px] left-[151px] rounded-[10px] top-[572px] w-[221px]" />
      <p className="absolute font-['Abel:Regular',sans-serif] leading-[normal] left-[243px] not-italic text-[18px] text-nowrap text-white top-[581px] whitespace-pre">Login</p>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents left-[120px] top-[307px]">
      <div className="absolute bg-white h-[329px] left-[120px] rounded-[10px] top-[307px] w-[283px]" />
      <div className="absolute left-[219px] size-[85px] top-[345px]" data-name="user (2) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgUser21} />
      </div>
      <p className="absolute font-['Josefin_Sans:Bold',sans-serif] font-bold leading-[normal] left-[205px] text-[25px] text-[rgba(139,0,0,0.7)] text-nowrap top-[459px] whitespace-pre">FACULTY</p>
      <Group7 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents left-[530px] top-[572px]">
      <div className="absolute bg-[rgba(139,0,0,0.7)] h-[40px] left-[530px] rounded-[10px] top-[572px] w-[221px]" />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents left-[530px] top-[572px]">
      <Group8 />
      <p className="absolute font-['Abel:Regular',sans-serif] leading-[normal] left-[624px] not-italic text-[18px] text-nowrap text-white top-[581px] whitespace-pre">Login</p>
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute contents left-[912px] top-[572px]">
      <div className="absolute bg-[rgba(139,0,0,0.7)] h-[40px] left-[912px] rounded-[10px] top-[572px] w-[221px]" />
      <p className="absolute font-['Abel:Regular',sans-serif] leading-[normal] left-[1004px] not-italic text-[18px] text-nowrap text-white top-[578px] whitespace-pre">Login</p>
    </div>
  );
}

export default function MainLoginPage() {
  return (
    <div className="bg-[darkred] relative size-full" data-name="MAIN LOGIN PAGE">
      <Group5 />
      <p className="absolute font-['Abel:Regular',sans-serif] leading-[normal] left-[523px] not-italic text-[15px] text-nowrap text-white top-[701px] whitespace-pre">© 2025 Lyceum Cavite ICT Department</p>
      <p className="absolute font-['Jost:Regular',sans-serif] font-normal leading-[normal] left-[477px] text-[20px] text-nowrap text-white top-[251px] whitespace-pre">Choose your login portal to get started</p>
      <p className="absolute font-['Abel:Regular',sans-serif] leading-[normal] left-[494px] not-italic text-[15px] text-nowrap text-white top-[735px] whitespace-pre">Need help? Contact support@lyceum-cavite.edu.ph</p>
      <Group6 />
      <Group9 />
      <Group10 />
    </div>
  );
}