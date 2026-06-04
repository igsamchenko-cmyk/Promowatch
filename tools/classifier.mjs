export const colors = {
  "Молочні": "#245fbd",
  "Ковбаси": "#b12f3b",
  "М'ясо": "#d7352a",
  "Яйця": "#d7a018",
  "Алкоголь": "#8a3d74",
  "Заморозка": "#6f61a8",
  "Хліб": "#b97811",
  "Овочі та фрукти": "#16845c",
  "Бакалія": "#d49a21",
  "Солодощі": "#7c4a88",
  "Кава та чай": "#5f493f",
  "Напої": "#245fbd",
  "Консерви": "#2d7f8f",
  "Риба та морепродукти": "#2d7f8f",
  "Товари для тварин": "#2d7f8f",
  "Побутова хімія": "#245fbd",
  "Снеки": "#5f493f",
  "Готові страви": "#d49a21",
  "Товари для дому": "#384551",
  "Інше": "#384551"
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’ʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text, pattern) {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

const rules = {
  pet: /корм|для кот|для кіт|для кіш|для собак|для пес|тварин|наповнювач.*(кот|кіш|тварин|туалет)|туалет.*(кот|кіш|тварин)|миска природа|pre-?vital|e-?zoo|whiskas|purina|club 4 paws|club4paws|friskies|felix|gourmet|pedigree|dreamies/,
  household: /праль|прання|засіб|відбілювач|ополіскувач.*білизн|кондиціонер.*білизн|perwoll|persil|zewa|папір туал|рушник папер|сервет|проклад|тампон|підгуз|уролог|бритв|шампун|душ|мило|дезодорант|лосьйон|зубн|крем-?гель|гель для|крем(?![-\s]?(сир|суп))(?=.*(облич|тіл|рук|волос|шкір|spf|захист|голін|засмаг|зволож|живиль))/,
  coffeeTea: /кава|чай|цикор|maccoffee|jacobs|monarch|nescafe|tea moments|lipton|lovare|ahmad/,
  plantDrink: /напій.*(вівсян|мигдал|соєв|рисов|кокос|гречан)|vega milk|oat&|oat\s*banana/,
  nonAlcoholic: /безалкогольн/,
  alcohol: /слабоалкогольн|пиво|вино|віно|віскі|лікер|горіл|сидр|шампан|ігрист|брют|просек|prosecco|frizzante|аперитив|бренді|коньяк|(^|[^а-яіїєґ])ром(у|ом|а)?(?=[^а-яіїєґ]|$)|(^|[^а-яіїєґ])джин(у|ом|а)?(?=[^а-яіїєґ]|$)|текіл|вермут|бальзам.*\d+%/,
  fish: /крабов|оселед|кревет|міді|кальмар|морепродукт|ікра|шпрот|сардин|скумбр|форел|сьомг|(^|[^а-яіїєґ])хек([^а-яіїєґ]|$)|минтай|лосос|тунець|масляна|анчоус|(^|[^а-яіїєґ])риб(а|н|к|н[а-яіїєґ])|(^|[^а-яіїєґ])кільк/,
  iceCream: /морозив|ескімо|пломбір|сорбет|ice\s*laska|хладик|ласка.*ескімо|лімо.*пломбір/,
  frozenDumplings: /пельмен|вареник|гіоза|gyoza/,
  frozenOther: /заморож|піца|тісто листков|тісто дріждж|суміш овоч|овоч.*заморож|броколі.*заморож|картоп.*фрі/,
  ready: /плов|крем-суп|(^|\s)суп(\s|$)|смажен[а-яіїєґ]* картоп|гриль|салат готов|готов[а-яіїєґ]* страв|закуска бутербродн|намазк/,
  sausage: /ковбас|сосиск|сардель|салям|шинка|бекон|балик|кабанос/,
  eggs: /(^|\s)яйц[яеі]?(\s|$)|(^|\s)яйце(\s|!|,|$)/,
  meat: /куряч|курчат|курк(?!ум)|гоміл|крил|четверт|стегн|індич|свин|ялович|м'яс|фарш|биток|паштет|буженин/,
  cottageDairy: /сир кисломол|кисломолочн[а-яіїєґ]* сир|творог|сирок|сирков|паста сирков|actimel/,
  hardCheese: /моцарел|сулугун|камамбер|(^|\s)брі(\s|$)|пармезан|гауд|чеддер|фета|фелата|голланд|російськ|тверд[а-яіїєґ]* сир|сир .*тверд|крем-сир|philadelphia|плавлен[а-яіїєґ]* сир|(^|\s)сир(\s|$|,)|сири(\s|$)|сиру(\s|$)/,
  dairy: /молоко|молочн|кефір|йогурт|сметан(?!ков)|вершк|масло(?!.*тіла)|згущ|кисломол|ряжан|айран|закваск|пудинг молоч|десерт молоч/,
  canned: /консерв|з\/б|ж\/б|тушк|тушон|оливки|маслини|кукурудз.*консерв|горошок.*консерв|квасол.*консерв|ананас.*сироп|персик.*сироп/,
  bread: /хліб|батон|багет|лаваш|булоч|круасан|випіч|сушка|хлібц|тортиль/,
  produce: /яблу|огір|томат|помід|картоп|капуст|салат|зелень|цибул|кріп|петруш|(^|[^а-яіїєґ])гриб|мандар|банан|ананас|манго|лохин|груш|сухофрукт|фрукт|овоч|буряк|моркв|перець|кабач/,
  drinks: /сік|нектар|напій|сироп|вода|(^|[^а-яіїєґ])квас(?![а-яіїєґ])|cola|coca|pepsi|sprite|(^|[^a-z])fanta([^a-z]|$)|тонік|лимонад|енергет/,
  sweets: /шокол|цукер|ірис(?!т)|печив|зефір|мармелад|тістеч|торт|халва|батончик|вафл|десерт|желе|гумка жув|жувальн.*гумк|рулет бісквіт|ролліні|карамел/,
  snacks: /насіння|арахіс|горіх|фісташ|ч[іи]пс|снек|сухар|крекер|грінк|соломк.*картоп|картоплян[а-яіїєґ]* соломк|маршмелоу|сушен[а-яіїєґ]* багет|jokers/,
  grocery: /круп|греч|(^|[^а-яіїєґ])рис(?![а-яіїєґ])|булгур|кус[-\s]?кус|вівсян|пшен|каша|пластівц|сухий сніданок|сніданки сухі|мюслі|макарон|спагеті|паста(?!.*(зубн|сирков))|локшина|вермішел|пюре картоп|олія|борош|цукор|сіль|сочевиц|соус|кетчуп|майонез|гірчиц|заправк|маринад|приправа|спец|бульйон|куркум|паприк|прянощ|розпушувач|борщ/,
  home: /ніж|ножі|дошк|склян|келих|таріл|каструл|сковор|контейнер|пакет для сміття|фольга|пергамент|губк|серветк.*прибиран|рукавич/
};

function isHardCheeseProduct(text) {
  if (has(text, rules.cottageDairy)) return false;
  if (!has(text, rules.hardCheese)) return false;
  if (/сироп|соус|смак(ом)? сиру|зі смаком сиру|сирна тарілка|попкорн|ч[іи]пс|снек|оливки|маслини/.test(text)) return false;
  return /моцарел|сулугун|камамбер|(^|\s)брі(\s|$)|пармезан|гауд|чеддер|фета|фелата|голланд|російськ|тверд[а-яіїєґ]* сир|сир .*тверд|крем-сир|philadelphia|плавлен[а-яіїєґ]* сир|(^|\s)сир(\s|$|,)|сири(\s|$)|сиру(\s|$)/.test(text);
}

export function inferCategory(name) {
  const text = normalizeText(name);
  if (has(text, rules.pet)) return "Товари для тварин";
  if (has(text, rules.household)) return "Побутова хімія";
  if (has(text, rules.home)) return "Товари для дому";
  if (has(text, rules.coffeeTea)) return "Кава та чай";
  if (has(text, rules.nonAlcoholic)) return "Напої";
  if (has(text, rules.plantDrink)) return "Напої";
  if (has(text, rules.cottageDairy)) return "Молочні";
  if (isHardCheeseProduct(text)) return "Молочні";
  if (has(text, rules.alcohol)) return "Алкоголь";
  if (has(text, rules.fish)) return "Риба та морепродукти";
  if (has(text, rules.iceCream) || has(text, rules.frozenDumplings) || has(text, rules.frozenOther)) return "Заморозка";
  if (has(text, rules.sweets)) return "Солодощі";
  if (has(text, rules.snacks)) return "Снеки";
  if (has(text, rules.ready)) return "Готові страви";
  if (has(text, rules.sausage)) return "Ковбаси";
  if (has(text, rules.eggs)) return "Яйця";
  if (has(text, rules.drinks)) return "Напої";
  if (has(text, rules.grocery)) return "Бакалія";
  if (has(text, rules.dairy)) return "Молочні";
  if (has(text, rules.canned)) return "Консерви";
  if (has(text, rules.bread)) return "Хліб";
  if (has(text, rules.meat)) return "М'ясо";
  if (has(text, rules.produce)) return "Овочі та фрукти";
  return "Інше";
}

export function inferSubcategory(name, category) {
  const text = normalizeText(name);
  if (category === "Молочні") {
    if (has(text, rules.cottageDairy)) {
      if (/сирок|сирков|паста сирков|десерт|пудинг|коктейль/.test(text)) return "Сирки та десерти";
      if (/сир кисломол|творог|кисломолочн[а-яіїєґ]* сир/.test(text)) return "Кисломолочний сир";
    }
    if (isHardCheeseProduct(text)) {
      if (/моцарел/.test(text)) return "Моцарела";
      if (/сулугун/.test(text)) return "Сулугуні";
      if (/плавлен/.test(text)) return "Плавлений сир";
      if (/камамбер|(^|\s)брі(\s|$)|крем-сир|philadelphia|фета|фелата/.test(text)) return "М'які сири";
      return "Твердий/напівтвердий сир";
    }
    if (/айран|(^|\s)тан(\s|$)|напій кисломол|лактонія|actimel/.test(text)) return "Кисломолочні напої";
    if (/закваск/.test(text)) return "Закваски";
    if (/йогурт/.test(text)) return "Йогурти";
    if (/кефір/.test(text)) return "Кефір";
    if (/сметан/.test(text)) return "Сметана";
    if (/вершк/.test(text)) return "Вершки";
    if (/масло(?!.*тіла)/.test(text)) return "Масло";
    if (/згущ/.test(text)) return "Згущене молоко";
    if (/молоко/.test(text)) return "Молоко";
    return "Інша молочка";
  }
  if (category === "Ковбаси") {
    if (/сосиск|сардель/.test(text)) return "Сосиски та сардельки";
    if (/варен[а-яіїєґ]* ковбас/.test(text)) return "Варені ковбаси";
    if (/сирокоп|салям|с\/к|сиров/.test(text)) return "Сирокопчені ковбаси";
    if (/шинка|бекон|балик/.test(text)) return "Шинка та бекон";
    return "Інші ковбаси";
  }
  if (category === "Яйця") {
    if (/перепел/.test(text)) return "Перепелині яйця";
    return "Курячі яйця";
  }
  if (category === "М'ясо") {
    if (/індич/.test(text)) return "Індичка";
    if (/свин/.test(text)) return "Свинина";
    if (/ялович/.test(text)) return "Яловичина";
    if (/куряч|курчат|курк(?!ум)|гоміл|крил|четверт|стегн|філе/.test(text)) return "Курятина";
    if (/паштет/.test(text)) return "Паштети";
    return "Інше м'ясо";
  }
  if (category === "Заморозка") {
    if (has(text, rules.iceCream)) return "Морозиво";
    if (/пельмен/.test(text)) return "Пельмені";
    if (/вареник/.test(text)) return "Вареники";
    if (/піца/.test(text)) return "Піца";
    if (/тісто/.test(text)) return "Заморожене тісто";
    if (/овоч|суміш|броколі|картоп.*фрі/.test(text)) return "Заморожені овочі";
    return "Інша заморозка";
  }
  if (category === "Риба та морепродукти") {
    if (/крабов/.test(text)) return "Крабові палички";
    if (/оселед/.test(text)) return "Оселедець";
    if (/кревет|міді|кальмар|морепродукт/.test(text)) return "Морепродукти";
    if (/ікра/.test(text)) return "Ікра";
    return "Риба";
  }
  if (category === "Кава та чай") {
    if (/кава|maccoffee|jacobs|monarch|nescafe/.test(text)) return "Кава";
    if (/чай|tea moments|lipton|lovare|ahmad/.test(text)) return "Чай";
    if (/цикор/.test(text)) return "Цикорій";
    return "Інше";
  }
  if (category === "Напої") {
    if (/вода/.test(text)) return "Вода";
    if (/сік|нектар/.test(text)) return "Соки та нектари";
    if (/сироп/.test(text)) return "Сиропи";
    if (/квас/.test(text)) return "Квас";
    if (/безалкогольн.*пиво|пиво.*безалкогольн/.test(text)) return "Безалкогольне пиво";
    if (/безалкогольн/.test(text)) return "Безалкогольні напої";
    return "Інші напої";
  }
  if (category === "Алкоголь") {
    if (/пиво/.test(text)) return "Пиво";
    if (/вино|віно|шампан|ігрист|брют|просек|prosecco|frizzante/.test(text)) return "Вино";
    if (/віскі/.test(text)) return "Віскі";
    if (/(^|[^а-яіїєґ])джин(у|ом|а)?(?=[^а-яіїєґ]|$)/.test(text)) return "Джин";
    if (/горіл/.test(text)) return "Горілка";
    if (/бренді|коньяк/.test(text)) return "Бренді та коньяк";
    return "Інший алкоголь";
  }
  if (category === "Бакалія") {
    if (/макарон|спагеті|паста(?!.*зубн)|локшина|вермішел/.test(text)) return "Макарони";
    if (/пластівц|сухий сніданок|сніданки сухі|мюслі/.test(text)) return "Пластівці та сніданки";
    if (/круп|греч|(^|[^а-яіїєґ])рис(?![а-яіїєґ])|булгур|кус[-\s]?кус|вівсян|пшен|каша/.test(text)) return "Крупи";
    if (/олія|оливкова|соняшникова/.test(text)) return "Олія";
    if (/борош|цукор|сіль/.test(text)) return "Борошно, цукор, сіль";
    if (/соус|кетчуп|майонез|гірчиц|заправк|маринад/.test(text)) return "Соуси та заправки";
    if (/приправа|спец|бульйон|куркум|паприк|прянощ|розпушувач|борщ/.test(text)) return "Приправи";
    return "Інша бакалія";
  }
  if (category === "Солодощі") {
    if (/шокол/.test(text)) return "Шоколад";
    if (/печив|вафл/.test(text)) return "Печиво та вафлі";
    if (/цукер|ірис(?!т)|карамел/.test(text)) return "Цукерки";
    if (/тістеч|торт/.test(text)) return "Торти та тістечка";
    if (/батончик|драже/.test(text)) return "Батончики та драже";
    return "Інші солодощі";
  }
  if (category === "Овочі та фрукти") {
    if (/яблу|банан|мандар|ананас|манго|груш|лохин|фрукт|сухофрукт/.test(text)) return "Фрукти";
    if (/огір|томат|помід|картоп|капуст|салат|овоч|буряк|моркв|перець|кабач/.test(text)) return "Овочі";
    if (/зелень|цибул|кріп|петруш/.test(text)) return "Зелень";
    return "Інше";
  }
  if (category === "Консерви") {
    if (/тунець|шпрот|сардин|риба/.test(text)) return "Рибні консерви";
    if (/горош|кукурудз|квасол|оливки|маслин/.test(text)) return "Овочеві консерви";
    if (/ананас|персик|фрукт/.test(text)) return "Фруктові консерви";
    if (/тушк|м'яс/.test(text)) return "М'ясні консерви";
    return "Інші консерви";
  }
  if (category === "Побутова хімія") {
    if (/праль|прання|ополіскувач.*білизн|кондиціонер.*білизн/.test(text)) return "Прання";
    if (/проклад|тампон|підгуз|уролог|бритв/.test(text)) return "Особиста гігієна";
    if (/чист|миття|посуд|доместос/.test(text)) return "Прибирання";
    if (/шампун|душ|мило|гель|лосьйон|дезодорант|крем|зубн/.test(text)) return "Гігієна";
    if (/папір|сервет/.test(text)) return "Паперові товари";
    return "Інше";
  }
  if (category === "Снеки") {
    if (/ч[іи]пс/.test(text)) return "Чіпси";
    if (/сухар|крекер|грінк/.test(text)) return "Сухарики та крекери";
    if (/арахіс|горіх|насіння|фісташ/.test(text)) return "Горіхи та насіння";
    return "Інші снеки";
  }
  if (category === "Товари для тварин") {
    if (/корм.*кот|корм.*кіт|для кот|для кіт|для кіш/.test(text)) return "Для котів";
    if (/корм.*собак|для собак|для пес/.test(text)) return "Для собак";
    if (/сухий/.test(text)) return "Сухий корм";
    if (/вологий|пауч|желе|соус/.test(text)) return "Вологий корм";
    return "Інше для тварин";
  }
  if (category === "Хліб") {
    if (/хліб/.test(text)) return "Хліб";
    if (/батон|багет|лаваш|тортиль/.test(text)) return "Батони, багети, лаваш";
    if (/хлібц/.test(text)) return "Хлібці";
    return "Випічка";
  }
  if (category === "Готові страви") {
    if (/плов/.test(text)) return "Плов";
    if (/крем-суп|(^|\s)суп(\s|$)/.test(text)) return "Супи";
    if (/гриль/.test(text)) return "Гриль";
    if (/салат/.test(text)) return "Салати";
    return "Інші готові страви";
  }
  if (category === "Товари для дому") return "Дім та кухня";
  return "Інше";
}

export function classifyDeal(name) {
  const category = inferCategory(name);
  const subcategory = inferSubcategory(name, category);
  return {
    category,
    subcategory,
    color: colors[category] || colors["Інше"]
  };
}
