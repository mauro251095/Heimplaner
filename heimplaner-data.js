// ═══════════════════════════════════════════════
// HEIMPLANER – DATA & STATE
// ═══════════════════════════════════════════════

const RECIPES = [
  {
    id:'r1',emoji:'🍚',name:'Nasigoreng',cat:'Hauptspeisen',time:40,pers:4,
    tags:['asiatisch','poulet'],
    ing:[
      {n:'Basmatireis',q:'300',u:'g'},{n:'Wasser',q:'4.5',u:'dl'},
      {n:'Bundzwiebel',q:'1',u:'Stk'},{n:'Gemüse (Rüebli, Erbsli)',q:'250',u:'g'},
      {n:'Schinkenwürfeli',q:'100',u:'g'},{n:'Geschnetzeltes Pouletfleisch',q:'400',u:'g'},
      {n:'Mungbohnen-Sprossen',q:'250',u:'g'},{n:'Fleischbouillon',q:'1',u:'dl'},
      {n:'Sojasauce',q:'4',u:'EL'},{n:'Sambal Oelek',q:'0.5',u:'TL'},
      {n:'Öl zum Braten',q:'1',u:'EL'}
    ],
    steps:[
      'Reis im Sieb unter fliessendem kaltem Wasser spülen bis das Wasser klar ist. Wasser mit Reis aufkochen, Hitze reduzieren, zugedeckt bei kleinster Hitze ca. 15 Min. quellen lassen. Deckel nie abheben. Reis mit einer Gabel lockern.',
      'Bundzwiebel in Streifen, Grün in Ringe schneiden, Grün beiseite stellen. Rüebli schälen und in Stücke schneiden, Erbsli antauen lassen.',
      'Wenig Öl im Wok heiss werden lassen. Schinken ca. 2 Min. rührbraten, herausnehmen. Geschnetzeltes portionenweise je ca. 4 Min. rührbraten, herausnehmen.',
      'Rüebli ca. 8 Min. rührbraten, Zwiebelstreifen, Erbsli und Sprossen beigeben, ca. 2 Min. mitrührbraten.',
      'Bouillon, Sojasauce und Sambal Oelek mit dem Reis, dem Poulet und dem Schinken beigeben, mischen, nur noch heiss werden lassen.',
      'Nasigoreng anrichten und das beiseite gestellte Zwiebelgrün darüberstreuen.'
    ]
  },
  {
    id:'r2',emoji:'🍝',name:'Penne-Auflauf mit Lauch',cat:'Pasta',time:50,pers:4,
    tags:['vegetarisch','auflauf'],
    ing:[
      {n:'Lauch',q:'500',u:'g'},{n:'Penne Rigate',q:'350',u:'g'},
      {n:'Zwiebel',q:'1',u:'Stk'},{n:'Olivenöl',q:'1',u:'EL'},
      {n:'Salz',q:'0.5',u:'TL'},{n:'Pfeffer',q:'1',u:'Prise'},
      {n:'Doppelrahm-Frischkäse nature',q:'200',u:'g'},
      {n:'Hartkäse (z.B. L\'Etivaz)',q:'150',u:'g'},
      {n:'Petersilie',q:'0.5',u:'Bund'}
    ],
    steps:[
      'Lauch längs halbieren, waschen, in ca. 2 cm breite Streifen schneiden.',
      'Teigwaren im siedenden Salzwasser al dente kochen, dabei Lauch ca. 4 Min. mitkochen. Ca. 3 dl Kochwasser beiseite stellen, Teigwaren und Lauch abtropfen, in die vorbereitete Form verteilen.',
      'Ofen auf 220 Grad vorheizen. Zwiebel schälen, in Schnitze schneiden. Öl in einer Pfanne warm werden lassen, Zwiebel ca. 5 Min. andämpfen, würzen.',
      'Kochwasser dazugiessen, aufkochen. Pfanne von der Platte nehmen, Frischkäse darunterrühren. Käse dazureiben, mischen, unter die Teigwaren mischen.',
      'Gratinieren: ca. 15 Min. in der Mitte des Ofens. Herausnehmen, mischen.',
      'Petersilie grob schneiden und darüberstreuen. Servieren.'
    ]
  },
  {
    id:'r3',emoji:'🍗',name:'Honig-Senf-Poulet mit Reis',cat:'Hauptspeisen',time:35,pers:4,
    tags:['poulet','klassisch'],
    ing:[
      {n:'Langkornreis (Parboiled)',q:'300',u:'g'},
      {n:'Pouletschenkel-Steaks ohne Haut',q:'500',u:'g'},
      {n:'Olivenöl',q:'1',u:'EL'},{n:'Honig (flüssig)',q:'1',u:'EL'},
      {n:'Wasser',q:'2',u:'dl'},{n:'Saucen-Halbrahm',q:'2',u:'dl'},
      {n:'Senf',q:'3',u:'EL'},{n:'Salz',q:'0.5',u:'TL'},{n:'Pfeffer',q:'1',u:'Prise'}
    ],
    steps:[
      'Reis im siedenden Salzwasser ca. 15 Min. knapp weich kochen. Reis abtropfen, zurück in die Pfanne geben, zugedeckt warm halten.',
      'Pouletsteaks halbieren, mit Salz und Pfeffer würzen.',
      'Öl in einer Bratpfanne heiss werden lassen. Hitze reduzieren, Pouletsteaks beidseitig je ca. 3 Min. anbraten.',
      'Honig beigeben, kurz warm werden lassen. Poulet herausnehmen und beiseite stellen.',
      'Wasser, Saucen-Halbrahm und Senf in derselben Pfanne aufkochen, würzen.',
      'Hitze reduzieren, Pouletsteaks mit dem entstandenen Saft wieder beigeben, zugedeckt ca. 10 Min. köcheln.',
      'Reis mit den Pouletsteaks anrichten und servieren.'
    ]
  },
  {
    id:'r4',emoji:'🍖',name:'Poulet-Geschnetzeltes an Rahmsauce',cat:'Hauptspeisen',time:35,pers:4,
    tags:['poulet','rahm','klassisch'],
    ing:[
      {n:'Geschnetzeltes Pouletfleisch',q:'600',u:'g'},
      {n:'Bratbutter',q:'1',u:'EL'},{n:'Salz',q:'0.75',u:'TL'},
      {n:'Pfeffer',q:'1',u:'Prise'},{n:'Zwiebel',q:'1',u:'Stk'},
      {n:'Weisser Vermouth (Noilly Prat)',q:'0.5',u:'dl'},
      {n:'Hühnerbouillon',q:'2.5',u:'dl'},{n:'Saucen-Halbrahm',q:'2',u:'dl'},
      {n:'Petersilie',q:'1',u:'Bund'},{n:'Rosmarin',q:'4',u:'Zweiglein'}
    ],
    steps:[
      'Bratbutter in einer Bratpfanne heiss werden lassen. Poulet portionenweise je ca. 2 Min. anbraten, herausnehmen, würzen.',
      'Hitze reduzieren, Bratfett auftupfen, wenig Bratbutter beigeben.',
      'Zwiebel schälen, halbieren, in feine Streifen schneiden, ca. 2 Min. andämpfen.',
      'Vermouth dazugiessen, fast vollständig einkochen.',
      'Bouillon und Saucen-Halbrahm dazugiessen, unter Rühren aufkochen. Hitze reduzieren, ca. 10 Min. köcheln.',
      'Poulet mit dem entstandenen Saft wieder beigeben, nur noch heiss werden lassen, würzen.',
      'Petersilie und Rosmarin fein schneiden, darüberstreuen und anrichten.'
    ]
  },
  {
    id:'r5',emoji:'🍲',name:'Brotsuppe',cat:'Suppen',time:40,pers:4,
    tags:['vegetarisch','einfach'],
    ing:[
      {n:'Brot vom Vortag (z.B. Bürli)',q:'270',u:'g'},
      {n:'Zwiebeln',q:'2',u:'Stk'},{n:'Rüebli',q:'1',u:'Stk'},
      {n:'Olivenöl',q:'1',u:'EL'},{n:'Wasser',q:'1',u:'l'},
      {n:'Salz',q:'1.25',u:'TL'},{n:'Pfeffer',q:'1',u:'Prise'},
      {n:'Vollrahm',q:'2.5',u:'dl'}
    ],
    steps:[
      'Brot in Würfeli schneiden, in einer weiten Bratpfanne ohne Fett ca. 5 Min. rösten, beiseite stellen.',
      'Zwiebeln und Rüebli schälen, in ca. 1.5 cm grosse Stücke schneiden.',
      'Öl in einer Pfanne warm werden lassen. Zwiebeln und Rüebli ca. 2 Min. andämpfen.',
      'Wasser dazugiessen, aufkochen, würzen. Hitze reduzieren, ¾ des Brotes beigeben, zugedeckt ca. 20 Min. weich köcheln.',
      'Die Hälfte des Rahms dazugiessen, im Mixglas pürieren.',
      'Restlichen Rahm flaumig schlagen. Suppe anrichten, flaumig geschlagenen Rahm mit den restlichen Brotwürfeli darauf verteilen.'
    ]
  },
  {
    id:'r6',emoji:'🐟',name:'Teriyaki-Lachs mit Spinat und Reis',cat:'Hauptspeisen',time:45,pers:2,
    tags:['fisch','asiatisch','gesund'],
    ing:[
      {n:'Ingwer',q:'2',u:'cm'},{n:'Sojasauce',q:'3',u:'EL'},
      {n:'Reiswein (Mirin)',q:'1',u:'EL'},{n:'Honig (flüssig)',q:'1',u:'TL'},
      {n:'Lachsfilet ohne Haut',q:'200',u:'g'},{n:'Basmatireis',q:'100',u:'g'},
      {n:'Wasser',q:'1.5',u:'dl'},{n:'Zwiebel',q:'1',u:'Stk'},
      {n:'Knoblauchzehe',q:'1',u:'Stk'},{n:'Spinat',q:'600',u:'g'},
      {n:'Sesamöl (geröstet)',q:'1.5',u:'TL'},{n:'Edamame (tiefgekühlt)',q:'80',u:'g'},
      {n:'Schwarzer Sesam',q:'1',u:'EL'}
    ],
    steps:[
      'Ingwer schälen, in eine Schüssel reiben. Sojasauce, Reiswein und Honig beigeben, verrühren.',
      'Lachs halbieren, in einen tiefen Teller legen, die Hälfte der Sauce darübergiessen. Zugedeckt im Kühlschrank ca. 20 Min. marinieren. Restliche Sauce beiseite stellen.',
      'Reis im Sieb unter fliessendem kaltem Wasser spülen. Wasser mit dem Reis aufkochen, zugedeckt bei kleinster Hitze ca. 15 Min. quellen lassen.',
      'Zwiebel und Knoblauch schälen, fein hacken. Spinat waschen. Öl im Wok heiss werden lassen. Zwiebel und Knoblauch ca. 1 Min. rührbraten.',
      'Spinat nach und nach beigeben, zusammenfallen lassen, Edamame beigeben, ca. 3 Min. köcheln. Beiseite gestellte Sauce daruntermischen, beiseite stellen.',
      'Öl in derselben Pfanne heiss werden lassen. Lachs trocken tupfen, beidseitig je ca. 2.5 Min. braten.',
      'Reis mit einer Gabel lockern, mit dem Gemüse und dem Lachs anrichten. Sesam darüberstreuen.'
    ]
  },
  {
    id:'r7',emoji:'🍚',name:'Risotto',cat:'Hauptspeisen',time:35,pers:4,
    tags:['vegetarisch','italienisch','klassisch'],
    ing:[
      {n:'Zwiebel',q:'1',u:'Stk'},{n:'Olivenöl',q:'1',u:'EL'},
      {n:'Risottoreis (Carnaroli)',q:'250',u:'g'},{n:'Weisswein',q:'2',u:'dl'},
      {n:'Gemüsebouillon (heiss)',q:'6.5',u:'dl'},
      {n:'Butter',q:'40',u:'g'},{n:'Parmesan (gerieben)',q:'40',u:'g'},
      {n:'Salz & Pfeffer',q:'1',u:'Prise'}
    ],
    steps:[
      'Zwiebel schälen, fein hacken. Öl in einer Pfanne warm werden lassen. Zwiebel ca. 5 Min. andämpfen.',
      'Reis beigeben, unter Rühren dünsten, bis er glasig ist.',
      'Wein dazugiessen, unter Rühren vollständig einkochen.',
      'Heisse Bouillon unter häufigem Rühren nach und nach dazugiessen, sodass der Reis immer knapp mit Flüssigkeit bedeckt ist. Ca. 20 Min. köcheln, bis der Reis cremig und al dente ist.',
      'Butter und Parmesan unter den Risotto mischen, abschmecken und servieren.'
    ]
  },
  {
    id:'r8',emoji:'🍆',name:'Vegane Auberginen-Involtini',cat:'Hauptspeisen',time:60,pers:4,
    tags:['vegan','italienisch'],
    ing:[
      {n:'Zwiebel',q:'1',u:'Stk'},{n:'Olivenöl',q:'4',u:'EL'},
      {n:'Tomatenpüree',q:'1',u:'EL'},{n:'Gehackte Tomaten',q:'2',u:'Dosen'},
      {n:'Zucker',q:'0.25',u:'TL'},{n:'Salz',q:'0.75',u:'TL'},
      {n:'Pfeffer',q:'1',u:'Prise'},{n:'Auberginen',q:'2',u:'Stk'},
      {n:'Veganer Frischkäse nature',q:'240',u:'g'},
      {n:'Oregano',q:'0.5',u:'Bund'},{n:'Basilikum',q:'0.5',u:'Bund'},
      {n:'Veganer Reibkäse',q:'4',u:'EL'}
    ],
    steps:[
      'Zwiebel schälen, fein hacken. Öl in einem Brattopf warm werden lassen. Zwiebel andämpfen, Tomatenpüree kurz mitdämpfen.',
      'Tomaten und Zucker beigeben, aufkochen, würzen. Hitze reduzieren, unter gelegentlichem Rühren ca. 20 Min. köcheln.',
      'Ofen auf 220 Grad vorheizen. Auberginen längs in ca. 5 mm dicke Scheiben schneiden, auf ein Blech mit Backpapier legen. Salzen, ca. 15 Min. ziehen lassen, trocken tupfen, beidseitig mit Öl bestreichen.',
      'Auberginen ca. 15 Min. in der Mitte des Ofens backen. Herausnehmen, etwas abkühlen lassen.',
      'Veganen Frischkäse verrühren. Oregano und Basilikum fein schneiden, 3 EL davon mit 2 EL Reibkäse darunterrühren, würzen.',
      'Füllung auf die Enden der Auberginenscheiben verteilen, satt aufrollen. Tomatensauce in der Form verteilen, Auberginenröllchen darauf legen, restlichen Reibkäse darüberstreuen.',
      'Nochmals ca. 15 Min. in der Mitte des Ofens backen. Restliche Kräuter darüberstreuen.'
    ]
  },
  {
    id:'r9',emoji:'🍕',name:'Pizzateig',cat:'Snacks',time:100,pers:4,
    tags:['vegetarisch','basic','teig'],
    ing:[
      {n:'Mehl',q:'400',u:'g'},{n:'Salz',q:'1.5',u:'TL'},
      {n:'Hefe',q:'10',u:'g'},{n:'Wasser',q:'2.5',u:'dl'},
      {n:'Olivenöl',q:'2',u:'EL'}
    ],
    steps:[
      'Mehl und Salz in einer Schüssel mischen, Hefe zerbröckeln und daruntermischen.',
      'Wasser und Öl dazugiessen, zu einem weichen, glatten Teig kneten.',
      'Zugedeckt bei Raumtemperatur ca. 1.5 Std. aufs Doppelte aufgehen lassen.',
      'Teig auf einer bemehlten Fläche auswallen und nach Wunsch belegen.'
    ]
  },
  {
    id:'r10',emoji:'🥩',name:'Gemüse-Wok mit Rindfleisch',cat:'Hauptspeisen',time:30,pers:4,
    tags:['rind','asiatisch','wok'],
    ing:[
      {n:'Rüebli',q:'400',u:'g'},{n:'Bundzwiebeln',q:'6',u:'Stk'},
      {n:'Rindsplätzli (z.B. Huft)',q:'500',u:'g'},
      {n:'Erdnussöl',q:'2',u:'EL'},{n:'Fleischbouillon',q:'6',u:'dl'},
      {n:'Helle Sojasauce',q:'2',u:'EL'},
      {n:'Chinesische Nudeln',q:'240',u:'g'},
      {n:'Mungbohnen-Sprossen',q:'100',u:'g'},
      {n:'Korianderblättchen',q:'2',u:'EL'},
      {n:'Salz',q:'0.5',u:'TL'},{n:'Pfeffer',q:'1',u:'Prise'}
    ],
    steps:[
      'Rüebli und Bundzwiebeln in ca. 5 mm dicke Scheiben schneiden. Fleisch in ca. 1 cm dicke Streifen schneiden.',
      'Im heissen Öl Fleisch portionenweise ca. 1 Min. rührbraten, herausnehmen, würzen.',
      'In derselben Bratpfanne Rüebli ca. 5 Min. rührbraten. Bundzwiebeln beigeben, ca. 2 Min. weiterrührbraten, herausnehmen.',
      'Bouillon und Sojasauce in die Pfanne giessen, aufkochen, Hitze reduzieren.',
      'Nudeln beigeben, al dente kochen.',
      'Sprossen, Fleisch und Gemüse beigeben, nur noch heiss werden lassen.',
      'Koriander darüberstreuen und servieren.'
    ]
  },
  {
    id:'r11',emoji:'🥕',name:'Rüebli-Ingwer-Suppe',cat:'Suppen',time:35,pers:4,
    tags:['vegetarisch','gesund','suppe'],
    ing:[
      {n:'Rüebli',q:'600',u:'g'},{n:'Schalotte',q:'1',u:'Stk'},
      {n:'Frischer Ingwer',q:'1',u:'TL'},{n:'Butter',q:'1',u:'EL'},
      {n:'Gemüsebouillon',q:'6',u:'dl'},{n:'Salz',q:'0.5',u:'TL'},
      {n:'Pfeffer',q:'1',u:'Prise'},{n:'Rahm',q:'2',u:'dl'},
      {n:'Petersilie',q:'0.5',u:'Bund'},{n:'Bio-Zitrone',q:'1',u:'Stk'}
    ],
    steps:[
      'Rüebli, Schalotte und Ingwer schälen. Rüebli und Schalotte in Scheiben schneiden, Ingwer fein reiben.',
      'Butter in einer Pfanne warm werden lassen. Rüebli, Schalotte und Ingwer ca. 2 Min. andämpfen.',
      'Bouillon dazugiessen, zugedeckt ca. 15 Min. weich köcheln.',
      'Suppe pürieren. Rahm knapp steif schlagen, die Hälfte darunter rühren, würzen.',
      'Rüeblistreifen (von 1 weiteren Rüebli) im Salzwasser ca. 1 Min. blanchieren, abtropfen.',
      'Suppe anrichten, restlichen Schlagrahm mit den Rüeblistreifen und Petersilie auf der Suppe verteilen. Zitronenschale darüberreiben.'
    ]
  },
  {
    id:'r12',emoji:'🐟',name:'Lachs-Wok mit Fenchel',cat:'Hauptspeisen',time:30,pers:4,
    tags:['fisch','wok','schnell'],
    ing:[
      {n:'Chinesische Eiernudeln',q:'200',u:'g'},
      {n:'Fenchel',q:'500',u:'g'},{n:'Lachsrückenfilet',q:'400',u:'g'},
      {n:'Öl zum Braten',q:'1',u:'EL'},{n:'Saucen-Halbrahm',q:'2',u:'dl'},
      {n:'Bio-Zitrone',q:'1',u:'Stk'},{n:'Salz',q:'0.75',u:'TL'},
      {n:'Pfeffer',q:'1',u:'Prise'},{n:'Basilikum',q:'1',u:'Bund'}
    ],
    steps:[
      'Teigwaren im siedenden Salzwasser al dente kochen, ca. 3 dl Kochwasser beiseite stellen, Teigwaren abtropfen.',
      'Fenchel in ca. 3 mm dicke Scheiben hobeln. Lachs in ca. 2 cm grosse Würfel schneiden.',
      'Wenig Öl im Wok heiss werden lassen. Lachs unter gelegentlichem Wenden ca. 3 Min. braten, herausnehmen, würzen.',
      'Wenig Öl im Wok heiss werden lassen. Fenchel ca. 5 Min. rührbraten.',
      'Saucen-Halbrahm mit dem beiseite gestellten Kochwasser dazugiessen, aufkochen. Hitze reduzieren, ca. 5 Min. köcheln.',
      'Zitronenschale dazureiben, Saft dazupressen, würzen.',
      'Teigwaren und Lachs wieder beigeben, sorgfältig mischen, heiss werden lassen. Basilikumblätter darüberstreuen.'
    ]
  },
  {
    id:'r13',emoji:'🧀',name:'Hörnligratin',cat:'Hauptspeisen',time:50,pers:4,
    tags:['klassisch','schweiz','auflauf'],
    ing:[
      {n:'Hörnli',q:'300',u:'g'},{n:'Tiefgekühlte Erbsli',q:'250',u:'g'},
      {n:'Cervelats',q:'3',u:'Stk'},{n:'Mozzarella',q:'150',u:'g'},
      {n:'Gruyère (gerieben)',q:'130',u:'g'},{n:'Gemüsebouillon (heiss)',q:'5',u:'dl'},
      {n:'Saucen-Halbrahm',q:'2',u:'dl'},{n:'Pfeffer',q:'1',u:'Prise'},
      {n:'Butter (weich)',q:'30',u:'g'},{n:'Paniermehl',q:'40',u:'g'},
      {n:'Petersilie',q:'0.5',u:'Bund'}
    ],
    steps:[
      'Ofen auf 200 Grad vorheizen.',
      'Hörnli und Erbsli in der vorbereiteten Form verteilen.',
      'Cervelats schälen, in ca. 5 mm dicke Scheiben schneiden. Die Hälfte unter die Teigwaren mischen, Rest beiseite stellen.',
      'Mozzarella in Würfeli schneiden, mit ¾ des Reibkäses unter die Teigwaren mischen.',
      'Bouillon und Saucen-Halbrahm verrühren, würzen, über den Gratin giessen. Restliche Cervelats darauflegen.',
      'Butter und Paniermehl mischen, mit dem restlichen Käse auf dem Gratin verteilen.',
      'Ca. 30 Min. in der Mitte des Ofens backen. Petersilie grob schneiden und über den Gratin streuen.'
    ]
  },
  {
    id:'r14',emoji:'🎃',name:'Kürbispizza',cat:'Snacks',time:35,pers:8,
    tags:['vegetarisch','pizza','herbst'],
    ing:[
      {n:'Ausgewallter Pizzateig (28×38cm)',q:'1',u:'Stk'},
      {n:'Crème fraîche',q:'200',u:'g'},
      {n:'Butternut-Kürbis',q:'300',u:'g'},
      {n:'Roter Peperoncino',q:'1',u:'Stk'},
      {n:'Olivenöl',q:'1',u:'EL'},{n:'Salz',q:'0.5',u:'TL'},
      {n:'Kürbiskerne',q:'2',u:'EL'},{n:'Oregano',q:'4',u:'Zweiglein'}
    ],
    steps:[
      'Ofen auf 240 Grad vorheizen.',
      'Teig entrollen, mit dem Backpapier in ein Blech ziehen, Teigrand rundum ca. 1 cm breit einschlagen.',
      'Teig mit der Crème fraîche bestreichen.',
      'Kürbis schälen, grob reiben. Peperoncino entkernen, fein hacken. Beides mit dem Öl mischen, salzen, auf der Crème fraîche verteilen.',
      'Kürbiskerne grob hacken, darüberstreuen.',
      'Ca. 25 Min. auf der untersten Rille des Ofens backen.',
      'Herausnehmen, Oreganoblättchen abzupfen und darüberstreuen.'
    ]
  }
];

const SK = 'heimplaner_v3';
const DS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const DL = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const CATS = ['Früchte & Gemüse','Kühlwaren','Fleisch & Fisch','Backwaren','Getränke','Haushalt','Tiefkühl','Vorrat','Sonstiges'];
const CAT_EMOJI = {'Früchte & Gemüse':'🥦','Kühlwaren':'🧀','Fleisch & Fisch':'🥩','Backwaren':'🍞','Getränke':'🥤','Haushalt':'🧹','Tiefkühl':'❄️','Vorrat':'🥫','Sonstiges':'📦'};

// Verfügbare Farben für Personen/Kategorien
const COLOR_OPTIONS = [
  {name:'Blau',    val:'#6C8EFF', bg:'rgba(108,142,255,0.12)'},
  {name:'Pink',    val:'#FF7EB3', bg:'rgba(255,126,179,0.12)'},
  {name:'Mint',    val:'#4ECDC4', bg:'rgba(78,205,196,0.12)'},
  {name:'Grün',    val:'#22c55e', bg:'rgba(34,197,94,0.12)'},
  {name:'Orange',  val:'#fb923c', bg:'rgba(251,146,60,0.12)'},
  {name:'Lila',    val:'#a78bfa', bg:'rgba(167,139,250,0.12)'},
  {name:'Gelb',    val:'#fbbf24', bg:'rgba(251,191,36,0.12)'},
  {name:'Rot',     val:'#f87171', bg:'rgba(248,113,113,0.12)'},
];

const DEFAULT_TASKS = {
  p1:[
    {id:'p1-1',emoji:'💪',name:'Sport',days:[0,2,4],prio:false,important:false,status:'open',time:'',reminder:''},
    {id:'p1-2',emoji:'📚',name:'Buch lesen',days:[0,1,2,3,4,5,6],prio:false,important:false,status:'open',time:'',reminder:''},
  ],
  p2:[
    {id:'p2-1',emoji:'🧘',name:'Yoga',days:[0,2,4,6],prio:false,important:false,status:'open',time:'',reminder:''},
    {id:'p2-2',emoji:'🎨',name:'Kreativprojekt',days:[2,5],prio:true,important:false,status:'open',time:'',reminder:''},
  ],
  shared:[
    {id:'s-1',emoji:'🛒',name:'Einkaufen',days:[3,6],prio:false,important:false,status:'open',time:'',reminder:''},
    {id:'s-2',emoji:'🍳',name:'Abendessen kochen',days:[0,1,2,3,4,5,6],prio:false,important:false,status:'open',time:'',reminder:''},
    {id:'s-3',emoji:'🚶',name:'Spaziergang',days:[2,6],prio:false,important:false,status:'open',time:'',reminder:''},
  ]
};

const DEFAULT_COLORS = {
  p1: '#6C8EFF',
  p2: '#FF7EB3',
  shared: '#4ECDC4'
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
      if (!d.colors) d.colors = {...DEFAULT_COLORS};
      if (!d.theme) d.theme = 'dark';
      if (!d.events) d.events = [];
      // ensure important field on all tasks
      ['p1','p2','shared'].forEach(w => {
        d.tasks[w] = d.tasks[w].map(t => ({important:false,...t}));
      });
      return d;
    }
  } catch(e) {}
  return {
    tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    names: {p1:'Mauro', p2:'Melissa'},
    colors: {...DEFAULT_COLORS},
    theme: 'dark',
    done: {}, taskStatus: {}, taskNotes: {},
    shop: [], meals: {}, notes: [], customRecipes: [],
    events: [], birthdays: [], taskComments: {}
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
function dk(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}
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
  if(/tomat|gurk|salat|spinat|karott|rüebli|zucch|auberg|kohl|bohne|mais|beere|apfel|birn|zitron|mango|pfirsich|erdbeer|avocado|banane|melone|fenchel|kürbis|peperoncino|peperoni|erbsl/.test(n)) return 'Früchte & Gemüse';
  if(/milch|käse|joghurt|butter|eier?|\bei\b|mozzarella|feta|ricotta|mascarpone|crème|quark|rahm|sahne|frischkäse/.test(n)) return 'Kühlwaren';
  if(/fleisch|poulet|rind|schwein|hack|speck|lachs|forelle|thunfisch|fisch|cervelat|schinken/.test(n)) return 'Fleisch & Fisch';
  if(/brot|mehl|toast|brötch|pita|fladenb|wrap|tortilla|croissant|hörnli|teigwaren|pasta|penne|nudel|reis/.test(n)) return 'Backwaren';
  if(/wasser|saft|wein|bier|kaffee|tee|kokosmilch|mandelmilch|bouillon/.test(n)) return 'Getränke';
  if(/reinig|waschmitt|toilett|seife|shampoo/.test(n)) return 'Haushalt';
  if(/tiefkühl|gefroren|edamame/.test(n)) return 'Tiefkühl';
  return 'Vorrat';
}
function catEmoji(c) { return CAT_EMOJI[c]||'📦'; }

// Farbe einer Person/Kategorie holen
function getColor(who) {
  return (HP.colors && HP.colors[who]) || DEFAULT_COLORS[who] || '#6C8EFF';
}
function getColorBg(who) {
  const val = getColor(who);
  const opt = COLOR_OPTIONS.find(c=>c.val===val);
  return opt ? opt.bg : 'rgba(108,142,255,0.12)';
}

// Initialise global state
const HP = loadState();