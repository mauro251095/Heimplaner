// ═══════════════════════════════════════════════
// HEIMPLANER – DATA & STATE
// ═══════════════════════════════════════════════

const RECIPES = [
  {id:'r1',emoji:'🥣',name:'Birchermüesli',cat:'Frühstück',time:10,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Haferflocken',q:'150',u:'g'},{n:'Joghurt',q:'200',u:'ml'},{n:'Äpfel',q:'2',u:'Stk'},{n:'Beeren',q:'150',u:'g'},{n:'Honig',q:'2',u:'EL'},{n:'Nüsse',q:'40',u:'g'}]},
  {id:'r2',emoji:'🥞',name:'Pancakes mit Beeren',cat:'Frühstück',time:20,pers:2,tags:['vegetarisch'],ing:[{n:'Mehl',q:'200',u:'g'},{n:'Milch',q:'250',u:'ml'},{n:'Eier',q:'2',u:'Stk'},{n:'Blaubeeren',q:'200',u:'g'},{n:'Ahornsirup',q:'4',u:'EL'},{n:'Butter',q:'30',u:'g'},{n:'Backpulver',q:'1',u:'TL'}]},
  {id:'r3',emoji:'🥚',name:'Rührei mit Tomaten',cat:'Frühstück',time:10,pers:2,tags:['schnell','vegetarisch'],ing:[{n:'Eier',q:'4',u:'Stk'},{n:'Kirschtomaten',q:'150',u:'g'},{n:'Butter',q:'20',u:'g'},{n:'Schnittlauch',q:'1',u:'Bund'},{n:'Salz & Pfeffer',q:'1',u:'Prise'}]},
  {id:'r4',emoji:'🍞',name:'French Toast',cat:'Frühstück',time:15,pers:2,tags:['vegetarisch'],ing:[{n:'Weissbrot',q:'4',u:'Scheiben'},{n:'Eier',q:'3',u:'Stk'},{n:'Milch',q:'100',u:'ml'},{n:'Pfirsiche',q:'2',u:'Stk'},{n:'Ahornsirup',q:'3',u:'EL'},{n:'Butter',q:'20',u:'g'}]},
  {id:'r5',emoji:'🫐',name:'Beeren-Smoothie Bowl',cat:'Frühstück',time:10,pers:2,tags:['schnell','vegan'],ing:[{n:'Gefrorene Beeren',q:'300',u:'g'},{n:'Banane',q:'1',u:'Stk'},{n:'Mandelmilch',q:'100',u:'ml'},{n:'Granola',q:'80',u:'g'},{n:'Frische Beeren',q:'100',u:'g'}]},
  {id:'r6',emoji:'🥐',name:'Croissant mit Schinken & Käse',cat:'Frühstück',time:5,pers:2,tags:['schnell'],ing:[{n:'Croissants',q:'4',u:'Stk'},{n:'Schinken',q:'80',u:'g'},{n:'Emmentaler',q:'60',u:'g'},{n:'Senf',q:'1',u:'TL'}]},
  {id:'r7',emoji:'☕',name:'Granola mit Sommerfrüchten',cat:'Frühstück',time:5,pers:2,tags:['schnell','vegan'],ing:[{n:'Granola',q:'150',u:'g'},{n:'Kokosmilch',q:'200',u:'ml'},{n:'Pfirsiche',q:'2',u:'Stk'},{n:'Erdbeeren',q:'100',u:'g'}]},
  {id:'r8',emoji:'🌺',name:'Caprese',cat:'Salate',time:10,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Rindstomaten',q:'3',u:'Stk'},{n:'Büffelmozzarella',q:'250',u:'g'},{n:'Basilikum',q:'1',u:'Bund'},{n:'Olivenöl',q:'3',u:'EL'},{n:'Balsamico-Creme',q:'1',u:'EL'},{n:'Fleur de Sel',q:'1',u:'Prise'}]},
  {id:'r9',emoji:'🍉',name:'Wassermelone mit Feta',cat:'Salate',time:10,pers:4,tags:['vegetarisch','schnell'],ing:[{n:'Wassermelone',q:'1/2',u:'Stk'},{n:'Feta',q:'150',u:'g'},{n:'Minze',q:'1',u:'Bund'},{n:'Limette',q:'1',u:'Stk'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r10',emoji:'🍓',name:'Erdbeer-Spinat-Salat',cat:'Salate',time:15,pers:2,tags:['vegetarisch'],ing:[{n:'Spinat',q:'150',u:'g'},{n:'Erdbeeren',q:'250',u:'g'},{n:'Ziegenkäse',q:'100',u:'g'},{n:'Walnüsse',q:'40',u:'g'},{n:'Balsamico-Creme',q:'2',u:'EL'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r11',emoji:'🥗',name:'Thunfisch-Salat mit Ei',cat:'Salate',time:15,pers:2,tags:['fisch','schnell'],ing:[{n:'Thunfisch (Dose)',q:'2',u:'Dosen'},{n:'Eier',q:'2',u:'Stk'},{n:'Kirschtomaten',q:'150',u:'g'},{n:'Eisbergsalat',q:'1/2',u:'Kopf'},{n:'Oliven',q:'40',u:'g'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r12',emoji:'🍐',name:'Rucola-Birnen-Salat',cat:'Salate',time:10,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Rucola',q:'100',u:'g'},{n:'Birnen',q:'2',u:'Stk'},{n:'Parmesan',q:'40',u:'g'},{n:'Walnüsse',q:'40',u:'g'},{n:'Honig',q:'1',u:'EL'},{n:'Balsamico',q:'2',u:'EL'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r13',emoji:'🥗',name:'Poulet-Avocado-Salat',cat:'Salate',time:20,pers:2,tags:['proteinreich'],ing:[{n:'Pouletbrust',q:'2',u:'Stk'},{n:'Avocado',q:'1',u:'Stk'},{n:'Kirschtomaten',q:'150',u:'g'},{n:'Eisbergsalat',q:'1/2',u:'Kopf'},{n:'Zitronensaft',q:'1',u:'EL'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r14',emoji:'🌿',name:'Pesto-Pasta',cat:'Pasta',time:20,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Pasta',q:'300',u:'g'},{n:'Basilikum-Pesto',q:'4',u:'EL'},{n:'Kirschtomaten',q:'200',u:'g'},{n:'Parmesan',q:'50',u:'g'},{n:'Pinienkerne',q:'30',u:'g'}]},
  {id:'r15',emoji:'🍅',name:"Pasta Arrabbiata",cat:'Pasta',time:25,pers:2,tags:['vegetarisch'],ing:[{n:'Penne',q:'300',u:'g'},{n:'Tomaten (Dose)',q:'400',u:'g'},{n:'Chiliflocken',q:'1',u:'TL'},{n:'Olivenöl',q:'3',u:'EL'},{n:'Parmesan',q:'40',u:'g'},{n:'Knoblauch',q:'2',u:'Zehen',optional:true}]},
  {id:'r16',emoji:'🥚',name:'Pasta Carbonara',cat:'Pasta',time:20,pers:2,tags:['klassisch'],ing:[{n:'Spaghetti',q:'300',u:'g'},{n:'Speck',q:'100',u:'g'},{n:'Eier',q:'3',u:'Stk'},{n:'Parmesan',q:'60',u:'g'},{n:'Schwarzer Pfeffer',q:'1',u:'TL'}]},
  {id:'r17',emoji:'🍝',name:'Bolognese',cat:'Pasta',time:45,pers:4,tags:['klassisch'],ing:[{n:'Spaghetti',q:'400',u:'g'},{n:'Rindshackfleisch',q:'400',u:'g'},{n:'Tomaten (Dose)',q:'400',u:'g'},{n:'Karotte',q:'1',u:'Stk'},{n:'Sellerie',q:'1',u:'Stk'},{n:'Rotwein',q:'100',u:'ml'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Zwiebel',q:'1',u:'Stk',optional:true}]},
  {id:'r18',emoji:'🧀',name:'Mac and Cheese',cat:'Pasta',time:30,pers:2,tags:['vegetarisch','klassisch'],ing:[{n:'Makaroni',q:'300',u:'g'},{n:'Butter',q:'40',u:'g'},{n:'Mehl',q:'2',u:'EL'},{n:'Milch',q:'400',u:'ml'},{n:'Gruyère',q:'150',u:'g'},{n:'Parmesan',q:'50',u:'g'},{n:'Muskatnuss',q:'1',u:'Prise'}]},
  {id:'r19',emoji:'🍋',name:'Pasta al Limone',cat:'Pasta',time:20,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Spaghetti',q:'300',u:'g'},{n:'Butter',q:'40',u:'g'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Parmesan',q:'60',u:'g'},{n:'Sahne',q:'80',u:'ml'},{n:'Petersilie',q:'3',u:'EL'}]},
  {id:'r20',emoji:'🥓',name:'Pasta mit Speck & Tomaten',cat:'Pasta',time:20,pers:2,tags:['schnell','klassisch'],ing:[{n:'Rigatoni',q:'300',u:'g'},{n:'Speck',q:'120',u:'g'},{n:'Kirschtomaten',q:'200',u:'g'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Parmesan',q:'40',u:'g'},{n:'Basilikum',q:'4',u:'Blätter'}]},
  {id:'r21',emoji:'🍗',name:'Poulet mit Kräuterbutter',cat:'Hauptspeisen',time:35,pers:2,tags:['klassisch'],ing:[{n:'Pouletbrüste',q:'2',u:'Stk'},{n:'Butter',q:'60',u:'g'},{n:'Rosmarin',q:'2',u:'Zweige'},{n:'Thymian',q:'2',u:'Zweige'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r22',emoji:'🥩',name:'Zürich Geschnetzeltes',cat:'Hauptspeisen',time:30,pers:2,tags:['klassisch','schweiz'],ing:[{n:'Kalbfleisch',q:'400',u:'g'},{n:'Sahne',q:'200',u:'ml'},{n:'Weisswein',q:'80',u:'ml'},{n:'Butter',q:'40',u:'g'},{n:'Rösti',q:'2',u:'Port.'},{n:'Petersilie',q:'2',u:'EL'}]},
  {id:'r23',emoji:'🐟',name:'Lachs aus dem Ofen',cat:'Hauptspeisen',time:25,pers:2,tags:['fisch'],ing:[{n:'Lachsfilets',q:'2',u:'Stk'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Dill',q:'3',u:'Zweige'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Kartoffeln',q:'400',u:'g'},{n:'Butter',q:'20',u:'g'}]},
  {id:'r24',emoji:'🥩',name:'Rindsfilet mit Gemüse',cat:'Hauptspeisen',time:30,pers:2,tags:['klassisch'],ing:[{n:'Rindsfilet',q:'300',u:'g'},{n:'Karotten',q:'2',u:'Stk'},{n:'Brokkoli',q:'200',u:'g'},{n:'Butter',q:'30',u:'g'},{n:'Rosmarin',q:'2',u:'Zweige'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r25',emoji:'🍕',name:'Flammkuchen mit Speck',cat:'Hauptspeisen',time:25,pers:2,tags:['klassisch'],ing:[{n:'Flammkuchenteig',q:'1',u:'Pkt'},{n:'Crème fraîche',q:'150',u:'g'},{n:'Speck',q:'100',u:'g'},{n:'Schnittlauch',q:'1',u:'Bund'},{n:'Zwiebeln',q:'2',u:'Stk',optional:true}]},
  {id:'r26',emoji:'🌯',name:'Poulet-Wrap',cat:'Hauptspeisen',time:20,pers:2,tags:['schnell'],ing:[{n:'Vollkorn-Wraps',q:'4',u:'Stk'},{n:'Pouletbrust',q:'2',u:'Stk'},{n:'Avocado',q:'1',u:'Stk'},{n:'Tomaten',q:'2',u:'Stk'},{n:'Eisbergsalat',q:'1/4',u:'Kopf'},{n:'Joghurt-Dressing',q:'2',u:'EL'}]},
  {id:'r27',emoji:'🫕',name:'Tomaten-Mozzarella-Auflauf',cat:'Hauptspeisen',time:30,pers:2,tags:['vegetarisch'],ing:[{n:'Tomaten',q:'500',u:'g'},{n:'Mozzarella',q:'250',u:'g'},{n:'Basilikum',q:'1',u:'Bund'},{n:'Olivenöl',q:'3',u:'EL'},{n:'Semmelbröseln',q:'50',u:'g'},{n:'Parmesan',q:'30',u:'g'}]},
  {id:'r28',emoji:'🥘',name:'Poulet-Reis-Pfanne',cat:'Hauptspeisen',time:35,pers:2,tags:['einfach'],ing:[{n:'Pouletbrust',q:'2',u:'Stk'},{n:'Langkornreis',q:'200',u:'g'},{n:'Peperoni',q:'1',u:'Stk'},{n:'Kirschtomaten',q:'150',u:'g'},{n:'Paprikapulver',q:'1',u:'TL'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r29',emoji:'🐟',name:'Forelle in Kräuterbutter',cat:'Hauptspeisen',time:25,pers:2,tags:['fisch','klassisch'],ing:[{n:'Forellen',q:'2',u:'Stk'},{n:'Butter',q:'80',u:'g'},{n:'Petersilie',q:'1',u:'Bund'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Mandeln (gehobelt)',q:'40',u:'g'}]},
  {id:'r30',emoji:'🍔',name:'Hausgemachter Burger',cat:'Hauptspeisen',time:30,pers:2,tags:['klassisch'],ing:[{n:'Rindshackfleisch',q:'400',u:'g'},{n:'Burger-Brötchen',q:'2',u:'Stk'},{n:'Cheddar',q:'60',u:'g'},{n:'Kopfsalat',q:'4',u:'Blätter'},{n:'Tomaten',q:'2',u:'Stk'},{n:'Ketchup & Senf',q:'2',u:'EL'}]},
  {id:'r31',emoji:'🥚',name:'Omelette mit Schinken',cat:'Hauptspeisen',time:10,pers:2,tags:['schnell','klassisch'],ing:[{n:'Eier',q:'6',u:'Stk'},{n:'Schinken',q:'80',u:'g'},{n:'Gruyère',q:'60',u:'g'},{n:'Butter',q:'20',u:'g'},{n:'Schnittlauch',q:'1',u:'Bund'}]},
  {id:'r32',emoji:'🥩',name:'Rindssteaks vom Grill',cat:'Grill',time:20,pers:2,tags:['klassisch'],ing:[{n:'Rindssteaks',q:'2',u:'Stk'},{n:'Butter',q:'40',u:'g'},{n:'Rosmarin',q:'2',u:'Zweige'},{n:'Fleur de Sel',q:'1',u:'Prise'},{n:'Pfeffer',q:'1',u:'Prise'}]},
  {id:'r33',emoji:'🍗',name:'Gegrilltes Poulet',cat:'Grill',time:35,pers:2,tags:['proteinreich'],ing:[{n:'Pouletschenkel',q:'4',u:'Stk'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Rosmarin',q:'2',u:'Zweige'},{n:'Thymian',q:'2',u:'Zweige'},{n:'Olivenöl',q:'3',u:'EL'},{n:'Paprikapulver',q:'1',u:'TL'}]},
  {id:'r34',emoji:'🍢',name:'Poulet-Spiesslein',cat:'Grill',time:25,pers:2,tags:['einfach'],ing:[{n:'Pouletbrust',q:'400',u:'g'},{n:'Peperoni',q:'2',u:'Stk'},{n:'Zucchetti',q:'1',u:'Stk'},{n:'Olivenöl',q:'3',u:'EL'},{n:'Paprikapulver',q:'1',u:'TL'},{n:'Zitronensaft',q:'1',u:'EL'}]},
  {id:'r35',emoji:'🌽',name:'Gegrillter Mais mit Butter',cat:'Grill',time:20,pers:2,tags:['vegetarisch'],ing:[{n:'Maiskolben',q:'4',u:'Stk'},{n:'Butter',q:'60',u:'g'},{n:'Chiliflocken',q:'1',u:'TL'},{n:'Limette',q:'1',u:'Stk'},{n:'Fleur de Sel',q:'1',u:'Prise'}]},
  {id:'r36',emoji:'🍖',name:'BBQ Spare Ribs',cat:'Grill',time:120,pers:2,tags:['klassisch'],ing:[{n:'Spare Ribs',q:'1',u:'kg'},{n:'BBQ-Sauce',q:'200',u:'ml'},{n:'Honig',q:'2',u:'EL'},{n:'Paprikapulver',q:'2',u:'TL'},{n:'Apfelessig',q:'2',u:'EL'}]},
  {id:'r37',emoji:'🐟',name:'Lachs vom Grill',cat:'Grill',time:20,pers:2,tags:['fisch'],ing:[{n:'Lachsfilets',q:'2',u:'Stk'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Dill',q:'3',u:'Zweige'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Fleur de Sel',q:'1',u:'Prise'}]},
  {id:'r38',emoji:'🍲',name:'Tomatensuppe',cat:'Suppen',time:25,pers:4,tags:['vegetarisch','klassisch'],ing:[{n:'Tomaten (Dose)',q:'800',u:'g'},{n:'Gemüsebouillon',q:'500',u:'ml'},{n:'Sahne',q:'100',u:'ml'},{n:'Basilikum',q:'4',u:'Blätter'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Zucker',q:'1',u:'TL'}]},
  {id:'r39',emoji:'🥕',name:'Karottensuppe',cat:'Suppen',time:30,pers:4,tags:['vegan'],ing:[{n:'Karotten',q:'600',u:'g'},{n:'Ingwer',q:'1',u:'TL'},{n:'Gemüsebouillon',q:'800',u:'ml'},{n:'Kokosmilch',q:'200',u:'ml'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r40',emoji:'🥦',name:'Brokkolisuppe',cat:'Suppen',time:25,pers:4,tags:['vegetarisch'],ing:[{n:'Brokkoli',q:'600',u:'g'},{n:'Kartoffeln',q:'200',u:'g'},{n:'Gemüsebouillon',q:'800',u:'ml'},{n:'Sahne',q:'100',u:'ml'},{n:'Gruyère',q:'60',u:'g'},{n:'Olivenöl',q:'2',u:'EL'}]},
  {id:'r41',emoji:'🥒',name:'Tzatziki mit Fladenbrot',cat:'Snacks',time:15,pers:4,tags:['vegetarisch','schnell'],ing:[{n:'Griechisches Joghurt',q:'400',u:'g'},{n:'Gurke',q:'1',u:'Stk'},{n:'Dill',q:'1',u:'Bund'},{n:'Olivenöl',q:'2',u:'EL'},{n:'Fladenbrot',q:'2',u:'Stk'},{n:'Knoblauch',q:'1',u:'Zehe',optional:true}]},
  {id:'r42',emoji:'🥔',name:'Klassische Rösti',cat:'Snacks',time:25,pers:2,tags:['vegetarisch','schweiz'],ing:[{n:'Kartoffeln',q:'600',u:'g'},{n:'Butter',q:'50',u:'g'},{n:'Salz',q:'1',u:'TL'},{n:'Muskatnuss',q:'1',u:'Prise'}]},
  {id:'r43',emoji:'🧀',name:'Käsebrot vom Grill',cat:'Snacks',time:10,pers:2,tags:['schnell','vegetarisch'],ing:[{n:'Baguette',q:'1',u:'Stk'},{n:'Gruyère',q:'120',u:'g'},{n:'Butter',q:'20',u:'g'},{n:'Schnittlauch',q:'1',u:'Bund'}]},
  {id:'r44',emoji:'🍟',name:'Ofenkartoffeln mit Sauerrahm',cat:'Snacks',time:60,pers:2,tags:['vegetarisch','klassisch'],ing:[{n:'Grosse Kartoffeln',q:'4',u:'Stk'},{n:'Sauerrahm',q:'150',u:'ml'},{n:'Butter',q:'30',u:'g'},{n:'Schnittlauch',q:'1',u:'Bund'},{n:'Speck',q:'60',u:'g'}]},
  {id:'r45',emoji:'🍦',name:'Frozen Yogurt mit Beeren',cat:'Desserts',time:10,pers:2,tags:['schnell','vegetarisch'],ing:[{n:'Griechisches Joghurt',q:'400',u:'g'},{n:'Gefrorene Beeren',q:'200',u:'g'},{n:'Honig',q:'2',u:'EL'},{n:'Granola',q:'80',u:'g'}]},
  {id:'r46',emoji:'🍑',name:'Gegrillte Pfirsiche mit Ricotta',cat:'Desserts',time:15,pers:2,tags:['vegetarisch','schnell'],ing:[{n:'Pfirsiche',q:'4',u:'Stk'},{n:'Ricotta',q:'200',u:'g'},{n:'Honig',q:'3',u:'EL'},{n:'Pistazien',q:'30',u:'g'},{n:'Basilikum',q:'4',u:'Blätter'}]},
  {id:'r47',emoji:'🍮',name:'Crème Brûlée',cat:'Desserts',time:40,pers:4,tags:['klassisch','vegetarisch'],ing:[{n:'Sahne',q:'500',u:'ml'},{n:'Eigelb',q:'5',u:'Stk'},{n:'Zucker',q:'80',u:'g'},{n:'Vanilleschote',q:'1',u:'Stk'}]},
  {id:'r48',emoji:'🧁',name:'Frozen Banana Pops',cat:'Desserts',time:15,pers:4,tags:['vegan','schnell'],ing:[{n:'Bananen',q:'4',u:'Stk'},{n:'Dunkle Schokolade',q:'150',u:'g'},{n:'Kokosflocken',q:'40',u:'g'}]},
  {id:'r49',emoji:'🍋',name:'Zitronen-Panna Cotta',cat:'Desserts',time:20,pers:4,tags:['vegetarisch','klassisch'],ing:[{n:'Sahne',q:'500',u:'ml'},{n:'Zucker',q:'60',u:'g'},{n:'Gelatine',q:'4',u:'Blätter'},{n:'Zitrone',q:'1',u:'Stk'},{n:'Vanilleschote',q:'1',u:'Stk'}]},
  {id:'r50',emoji:'🍫',name:'Schokoladen-Mousse',cat:'Desserts',time:25,pers:4,tags:['vegetarisch','klassisch'],ing:[{n:'Dunkle Schokolade',q:'200',u:'g'},{n:'Eier',q:'4',u:'Stk'},{n:'Sahne',q:'200',u:'ml'},{n:'Zucker',q:'40',u:'g'},{n:'Butter',q:'30',u:'g'}]}
];

const SK = 'heimplaner_v3';
const DS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const DL = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const CATS = ['Früchte & Gemüse','Kühlwaren','Fleisch & Fisch','Backwaren','Getränke','Haushalt','Tiefkühl','Vorrat','Sonstiges'];
const CAT_EMOJI = {'Früchte & Gemüse':'🥦','Kühlwaren':'🧀','Fleisch & Fisch':'🥩','Backwaren':'🍞','Getränke':'🥤','Haushalt':'🧹','Tiefkühl':'❄️','Vorrat':'🥫','Sonstiges':'📦'};

const DEFAULT_TASKS = {
  p1:[
    {id:'p1-1',emoji:'💪',name:'Sport',days:[0,2,4],prio:false,status:'open',time:'',reminder:''},
    {id:'p1-2',emoji:'📚',name:'Buch lesen',days:[0,1,2,3,4,5,6],prio:false,status:'open',time:'',reminder:''},
    {id:'p1-3',emoji:'🎧',name:'Podcast / Kurs',days:[1,3],prio:true,status:'open',time:'',reminder:''},
    {id:'p1-4',emoji:'✍️',name:'Tagebuch',days:[0,1,2,3,4,5,6],prio:false,status:'open',time:'',reminder:''},
  ],
  p2:[
    {id:'p2-1',emoji:'🧘',name:'Yoga',days:[0,2,4,6],prio:false,status:'open',time:'',reminder:''},
    {id:'p2-2',emoji:'🎨',name:'Kreativprojekt',days:[2,5],prio:true,status:'open',time:'',reminder:''},
    {id:'p2-3',emoji:'🌍',name:'Sprachen lernen',days:[1,3,5],prio:false,status:'open',time:'',reminder:''},
    {id:'p2-4',emoji:'📖',name:'Lesen',days:[0,1,2,3,4,5,6],prio:false,status:'open',time:'',reminder:''},
  ],
  shared:[
    {id:'s-1',emoji:'🛒',name:'Einkaufen',days:[3,6],prio:false,status:'open',time:'',reminder:''},
    {id:'s-2',emoji:'🍳',name:'Abendessen kochen',days:[0,1,2,3,4,5,6],prio:false,status:'open',time:'',reminder:''},
    {id:'s-3',emoji:'🚶',name:'Spaziergang',days:[2,6],prio:false,status:'open',time:'',reminder:''},
    {id:'s-4',emoji:'💬',name:'Wochenrückblick',days:[6],prio:true,status:'open',time:'',reminder:''},
  ]
};

function loadState() {
  try {
    const s = localStorage.getItem(SK);
    if (s) {
      const d = JSON.parse(s);
      if (!d.notes) d.notes = [];
      if (!d.customRecipes) d.customRecipes = [];
      if (!d.taskStatus) d.taskStatus = {};
      if (!d.taskNotes) d.taskNotes = {};
      return d;
    }
  } catch(e) {}
  return {
    tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    names: {p1:'Mauro', p2:'Lena'},
    done: {}, taskStatus: {}, taskNotes: {},
    shop: [], meals: {}, notes: [], customRecipes: []
  };
}

function HP_save() {
  try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
}

// ── Helpers ──────────────────────────────────────────
function getMonday(off=0) {
  const n=new Date(), d=n.getDay(), diff=d===0?-6:1-d, m=new Date(n);
  m.setDate(n.getDate()+diff+off*7); m.setHours(0,0,0,0); return m;
}
function getWeekDates(off=0) {
  const m=getMonday(off);
  return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d;});
}
function dk(d) { return d.toISOString().slice(0,10); }
function isToday(d) { const t=new Date();t.setHours(0,0,0,0);return d.getTime()===t.getTime(); }
function isPast(d) { const t=new Date();t.setHours(0,0,0,0);return d<t; }
function wkNum(d) {
  const dt=new Date(d);dt.setHours(0,0,0,0);
  dt.setDate(dt.getDate()+3-(dt.getDay()+6)%7);
  const w1=new Date(dt.getFullYear(),0,4);
  return 1+Math.round(((dt-w1)/86400000-3+(w1.getDay()+6)%7)/7);
}
function isDone(date,tid) { const k=dk(date);return !!(HP.done[k]&&HP.done[k][tid]); }
function getStatus(tid) { return HP.taskStatus[tid]||'open'; }
function fmtTime(t) { if(!t)return '';const[h,m]=t.split(':');return h+':'+m; }
function allTasks(filter=null) {
  let arr=[
    ...HP.tasks.p1.map(t=>({...t,who:'p1'})),
    ...HP.tasks.p2.map(t=>({...t,who:'p2'})),
    ...HP.tasks.shared.map(t=>({...t,who:'shared'}))
  ];
  if(filter==='p1') arr=arr.filter(t=>t.who==='p1'||t.who==='shared');
  if(filter==='p2') arr=arr.filter(t=>t.who==='p2'||t.who==='shared');
  return arr;
}
function allRecipes() { return [...RECIPES,...(HP.customRecipes||[])]; }
function guessCat(name) {
  const n=name.toLowerCase();
  if(/tomat|gurk|salat|spinat|karott|zucch|auberg|kohl|bohne|mais|beere|apfel|birn|zitron|mango|pfirsich|erdbeer|avocado|banane|melone/.test(n)) return 'Früchte & Gemüse';
  if(/milch|käse|joghurt|butter|eier?|\bei\b|mozzarella|feta|ricotta|mascarpone|crème|quark|rahm|sahne/.test(n)) return 'Kühlwaren';
  if(/fleisch|poulet|rind|schwein|hack|speck|lachs|forelle|thunfisch|fisch/.test(n)) return 'Fleisch & Fisch';
  if(/brot|mehl|toast|brötch|pita|fladenb|wrap|tortilla|croissant/.test(n)) return 'Backwaren';
  if(/wasser|saft|wein|bier|kaffee|tee|kokosmilch|mandelmilch/.test(n)) return 'Getränke';
  if(/reinig|waschmitt|toilett|seife|shampoo/.test(n)) return 'Haushalt';
  if(/tiefkühl|gefroren/.test(n)) return 'Tiefkühl';
  return 'Vorrat';
}
function catEmoji(c) { return CAT_EMOJI[c]||'📦'; }

// Initialise global state
const HP = loadState();
