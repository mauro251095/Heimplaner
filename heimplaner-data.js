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
  },
  {
    id:'r15',emoji:'🍯',name:'Honig-Senf-Schweinsfilet mit Ofenkartoffeln & Brokkoli',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','schwein'],
    ing:[
      {n:'Schweinsfilet (mundgerechte Stücke)',q:'600',u:'g'},
      {n:'Festkochende Kartoffeln (gewürfelt, ca. 2cm)',q:'700',u:'g'},
      {n:'Brokkoli (in Röschen)',q:'1',u:'Kopf'},
      {n:'Honig',q:'3',u:'EL'},{n:'Senf',q:'2',u:'EL'},{n:'Olivenöl',q:'2',u:'EL'},
      {n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''},{n:'Paprikapulver',q:'1',u:'TL'}
    ],
    steps:[
      'Ofen auf 220°C (Ober-/Unterhitze) vorheizen, Blech mit Backpapier auslegen.',
      'Kartoffelwürfel mit 1 EL Olivenöl, Salz und Pfeffer mischen, auf dem Blech verteilen, 10 Min. vorbacken.',
      'Honig, Senf, restliches Öl und Paprikapulver verrühren, Schweinsfilet-Stücke darin wenden.',
      'Kartoffeln zur Seite schieben, mariniertes Fleisch und Brokkoli dazugeben, alles in einer Schicht verteilen.',
      'Weitere 15–18 Min. backen, bis das Fleisch durchgegart und die Kartoffeln weich sind.',
      'Auf 4 Boxen verteilen, Kartoffeln, Brokkoli und Fleisch nebeneinander anordnen, mit dem Bratensaft beträufeln.'
    ]
  },
  {
    id:'r16',emoji:'🥢',name:'Teriyaki-Rindfleisch mit Reis & Pak Choi',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','asiatisch','rind'],
    ing:[
      {n:'Rindfleischstreifen (Huft oder Nierstück)',q:'500',u:'g'},
      {n:'Pak Choi (in Streifen)',q:'2',u:'Stk'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Sojasauce',q:'4',u:'EL'},{n:'Honig',q:'2',u:'EL'},{n:'Sesamöl',q:'1',u:'EL'},
      {n:'Knoblauchzehe, gepresst',q:'1',u:'Stk'},{n:'Ingwer, gerieben',q:'1',u:'TL'},
      {n:'Speisestärke (optional, mit wenig Wasser angerührt)',q:'1',u:'TL'}
    ],
    steps:[
      'Reis nach Packungsanweisung kochen.',
      'Sojasauce, Honig, Knoblauch und Ingwer zur Teriyaki-Sauce verrühren.',
      'Sesamöl stark erhitzen, Rindfleisch portionenweise 2–3 Min. scharf anbraten, herausnehmen.',
      'Pak Choi in derselben Pfanne 2 Min. andünsten.',
      'Fleisch zurückgeben, Sauce zugeben, 2–3 Min. köcheln bis leicht eingedickt, bei Bedarf mit Speisestärke binden.',
      'Reis als Basis in die Box geben, Rindfleisch und Pak Choi darauf verteilen, mit Sauce beträufeln, nach Wunsch mit Sesam bestreuen.'
    ]
  },
  {
    id:'r17',emoji:'🧆',name:'Türkische Lamm-Köfte mit Bulgur & Joghurtsauce',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','lamm'],
    ing:[
      {n:'Lammhackfleisch (ersatzweise Rinderhackfleisch)',q:'500',u:'g'},
      {n:'Zwiebel, fein gerieben',q:'1',u:'Stk'},
      {n:'Knoblauchzehe, gepresst',q:'1',u:'Stk'},
      {n:'Kreuzkümmel',q:'2',u:'TL'},{n:'Paprikapulver',q:'1',u:'TL'},
      {n:'Petersilie, gehackt',q:'2',u:'EL'},{n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''},
      {n:'Olivenöl (zum Braten)',q:'1',u:'EL'},
      {n:'Bulgur',q:'250',u:'g'},
      {n:'Naturjoghurt',q:'250',u:'g'},{n:'Knoblauchzehe (für die Sauce)',q:'1',u:'Stk'},
      {n:'Zitronensaft',q:'',u:''}
    ],
    steps:[
      'Bulgur mit heissem Wasser oder Brühe übergiessen, zugedeckt 10–15 Min. quellen lassen.',
      'Hackfleisch mit Zwiebel, Knoblauch, Kreuzkümmel, Paprikapulver, Petersilie, Salz und Pfeffer kräftig verkneten.',
      'Aus der Masse 12 kleine, längliche Röllchen (ca. 8cm) formen, leicht flach drücken.',
      'Köfte in heissem Öl 4–5 Min. pro Seite braten, nur einmal wenden, bis rundum braun und durchgegart.',
      'Für die Sauce Joghurt mit gepresstem Knoblauch, Zitronensaft und Salz verrühren.',
      'Bulgur als Basis anrichten, 3 Köfte daraufsetzen, Joghurtsauce darüberträufeln oder separat dazustellen, mit Petersilie oder Minze garnieren.'
    ]
  },
  {
    id:'r18',emoji:'🥗',name:'Griechische Poulet-Bowl mit Couscous, Gurke & Feta',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','poulet','griechisch'],
    ing:[
      {n:'Pouletbrust, gewürfelt',q:'600',u:'g'},
      {n:'Couscous',q:'250',u:'g'},
      {n:'Gurke, gewürfelt',q:'1',u:'Stk'},{n:'Cherrytomaten, halbiert',q:'150',u:'g'},
      {n:'Feta',q:'150',u:'g'},
      {n:'Olivenöl',q:'2',u:'EL'},{n:'Zitronensaft',q:'1',u:'EL'},
      {n:'Getrockneter Oregano',q:'1',u:'TL'},{n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''}
    ],
    steps:[
      'Couscous mit der gleichen Menge kochendem Wasser/Brühe übergiessen, 5 Min. quellen lassen, mit Gabel auflockern.',
      'Poulet mit Oregano, Salz und Pfeffer würzen, in 1 EL Olivenöl 6–8 Min. braten bis durchgegart und leicht gebräunt.',
      'Olivenöl und Zitronensaft zum Dressing verrühren.',
      'Couscous als Basis in die Bowl geben, Poulet, Gurke und Cherrytomaten in getrennten Feldern anordnen, Feta darüberbröckeln, mit Dressing beträufeln.'
    ]
  },
  {
    id:'r19',emoji:'🥙',name:'Schweins-Gyros-Bowl mit Tzatziki & Reis',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','schwein','griechisch'],
    ing:[
      {n:'Schweinsgeschnetzeltes oder Nackensteak, in Streifen',q:'600',u:'g'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Gyros-Gewürzmischung',q:'2',u:'EL'},{n:'Olivenöl',q:'1',u:'EL'},
      {n:'Naturjoghurt',q:'250',u:'g'},{n:'Gurke, gerieben',q:'0.5',u:'Stk'},
      {n:'Knoblauchzehe',q:'1',u:'Stk'},{n:'Dill, gehackt',q:'1',u:'EL'}
    ],
    steps:[
      'Reis kochen.',
      'Fleisch mit Gyros-Gewürz und Öl vermengen, wenn möglich kurz durchziehen lassen.',
      'In heisser Pfanne portionenweise 5–6 Min. scharf anbraten, bis durchgegart und leicht kross.',
      'Für Tzatziki: geriebene Gurke gut ausdrücken, mit Joghurt, gepresstem Knoblauch, Dill und Salz verrühren.',
      'Reis als Basis, Fleisch darauf verteilen, Tzatziki separat dazustellen oder als Klecks obendrauf.'
    ]
  },
  {
    id:'r20',emoji:'🌮',name:'Mexikanische Rindfleisch-Reispfanne mit Bohnen & Peperoni',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','rind','mexikanisch'],
    ing:[
      {n:'Rinderhackfleisch',q:'500',u:'g'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Schwarze Bohnen (Dose, abgetropft)',q:'1',u:'Dose'},
      {n:'Peperoni, gewürfelt',q:'2',u:'Stk'},{n:'Zwiebel, gehackt',q:'1',u:'Stk'},
      {n:'Mais (Dose, abgetropft)',q:'1',u:'Dose'},
      {n:'Kreuzkümmel',q:'1',u:'TL'},{n:'Paprikapulver',q:'1',u:'TL'},{n:'Koriander (zum Garnieren)',q:'',u:''}
    ],
    steps:[
      'Reis kochen.',
      'Hackfleisch krümelig anbraten, bis keine rohen Stellen mehr sichtbar sind.',
      'Zwiebel und Peperoni dazugeben, 4–5 Min. mitdünsten bis weich.',
      'Gewürze einrühren, 1 Min. mitrösten, Bohnen und Mais zugeben, 5 Min. köcheln.',
      'Reis in die Box geben, Hackfleischmischung darüber verteilen, mit frischem Koriander bestreuen.'
    ]
  },
  {
    id:'r21',emoji:'🍛',name:'Cremiges Peperoni-Poulet mit Reis',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','poulet','rahm'],
    ing:[
      {n:'Pouletbrust, in Streifen',q:'600',u:'g'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Rote Peperoni, in Streifen',q:'2',u:'Stk'},{n:'Zwiebel, gehackt',q:'1',u:'Stk'},
      {n:'Halbrahm (Kochrahm)',q:'200',u:'ml'},{n:'Paprikapulver',q:'1',u:'EL'},
      {n:'Gemüsebrühe',q:'1',u:'dl'}
    ],
    steps:[
      'Reis kochen.',
      'Poulet 5–6 Min. anbraten, bis durchgegart, herausnehmen.',
      'Zwiebel und Peperoni in derselben Pfanne 4–5 Min. andünsten.',
      'Mit Gemüsebrühe ablöschen, Paprikapulver einrühren, Halbrahm dazugeben.',
      'Poulet zurückgeben, 5–8 Min. köcheln, bis die Sauce leicht eindickt.',
      'Reis als Basis, Poulet in der Rahmsauce darübergeben.'
    ]
  },
  {
    id:'r22',emoji:'🥩',name:'BBQ-Rindshuft mit Kartoffelpüree & Rahmspinat',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','rind'],
    ing:[
      {n:'Rindshuft oder Rinds-Entrecôte',q:'600',u:'g'},{n:'BBQ-Sauce',q:'',u:''},
      {n:'Mehligkochende Kartoffeln',q:'700',u:'g'},{n:'Milch',q:'',u:''},{n:'Butter',q:'',u:''},
      {n:'Blattspinat (TK oder frisch)',q:'500',u:'g'},{n:'Schalotte, gehackt',q:'1',u:'Stk'},
      {n:'Knoblauchzehe',q:'1',u:'Stk'},{n:'Halbrahm',q:'150',u:'ml'},{n:'Muskatnuss',q:'',u:''}
    ],
    steps:[
      'Kartoffeln schälen, würfeln, in Salzwasser 15–18 Min. weichkochen, mit Milch und Butter zu Püree stampfen, salzen.',
      'Für den Rahmspinat: Schalotte und Knoblauch andünsten, ausgedrückten Spinat dazugeben, kurz erhitzen, mit Halbrahm ablöschen, mit Muskatnuss, Salz und Pfeffer würzen, 5 Min. köcheln bis cremig.',
      'Rindfleisch mit Salz und Pfeffer würzen, in heisser Pfanne 3–4 Min. pro Seite anbraten, in den letzten 1–2 Min. mit BBQ-Sauce bepinseln.',
      'Fleisch 3–4 Min. ruhen lassen, dann in Scheiben schneiden.',
      'Kartoffelpüree und Rahmspinat nebeneinander anrichten, Fleischscheiben fächerartig darauflegen, mit BBQ-Sauce beträufeln.'
    ]
  },
  {
    id:'r23',emoji:'🦃',name:'Truthahn-Peperoni-Pfanne mit Reis',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','truthahn','asiatisch'],
    ing:[
      {n:'Truthahn-Geschnetzeltes',q:'500',u:'g'},
      {n:'Peperoni, in Streifen',q:'2',u:'Stk'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Sojasauce',q:'3',u:'EL'},{n:'Honig',q:'1',u:'TL'},{n:'Sesamöl',q:'1',u:'TL'},
      {n:'Knoblauchzehe',q:'1',u:'Stk'},{n:'Ingwer, gerieben',q:'1',u:'TL'},
      {n:'Speisestärke (optional, mit wenig Wasser angerührt)',q:'1',u:'TL'}
    ],
    steps:[
      'Reis kochen.',
      'Truthahn in heisser Pfanne 5–6 Min. anbraten, bis durchgegart, herausnehmen.',
      'Peperoni mit Knoblauch und Ingwer 3–4 Min. andünsten.',
      'Sojasauce und Honig einrühren, Truthahn zurückgeben, bei Bedarf mit Speisestärke kurz binden.',
      'Reis als Basis, Truthahn-Peperoni-Mischung darüber verteilen.'
    ]
  },
  {
    id:'r24',emoji:'🍝',name:'Truthahn-Frikadellen mit Nudeln & Tomatensauce',cat:'Pasta',time:35,pers:4,
    tags:['mealprep','truthahn'],
    ing:[
      {n:'Truthahnhackfleisch',q:'500',u:'g'},{n:'Ei',q:'1',u:'Stk'},
      {n:'Paniermehl',q:'3',u:'EL'},{n:'Knoblauchzehe, gepresst',q:'1',u:'Stk'},
      {n:'Italienische Kräuter',q:'1',u:'TL'},{n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''},
      {n:'Pasta (Penne oder Spaghetti)',q:'400',u:'g'},
      {n:'Passierte Tomaten',q:'400',u:'g'},{n:'Zwiebel, gehackt',q:'1',u:'Stk'},{n:'Olivenöl',q:'1',u:'EL'}
    ],
    steps:[
      'Hackfleisch, Ei, Paniermehl, Knoblauch, Kräuter, Salz und Pfeffer verkneten, zu 12–16 kleinen Bällchen formen.',
      'Frikadellen in Öl rundum 8–10 Min. braten, bis durchgegart.',
      'Für die Sauce: Zwiebel andünsten, passierte Tomaten zugeben, mit Salz, Pfeffer und Kräutern würzen, 10 Min. köcheln.',
      'Pasta nach Packungsanweisung kochen, abgiessen.',
      'Pasta in die Box geben, Tomatensauce darüber, Frikadellen obenauf verteilen, nach Wunsch mit Parmesan und Basilikum bestreuen.'
    ]
  },
  {
    id:'r25',emoji:'🌯',name:'Rind-Fajita-Bowl mit Peperoni, Zwiebeln & Reis',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','rind','mexikanisch'],
    ing:[
      {n:'Rindfleischstreifen (z.B. Huft)',q:'600',u:'g'},
      {n:'Peperoni, in Streifen',q:'2',u:'Stk'},{n:'Zwiebel, in Streifen',q:'1',u:'Stk'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Fajita-Gewürzmischung',q:'2',u:'EL'},{n:'Limette',q:'1',u:'Stk'},{n:'Koriander',q:'',u:''}
    ],
    steps:[
      'Reis kochen.',
      'Rindfleisch mit Fajita-Gewürz vermengen, in heisser Pfanne 3–4 Min. scharf anbraten, herausnehmen.',
      'Peperoni und Zwiebel in derselben Pfanne 4–5 Min. anbraten, bis leicht weich, aber noch bissfest.',
      'Fleisch zurückgeben, mit Limettensaft beträufeln, kurz durchschwenken.',
      'Reis als Basis, Fleisch-Gemüse-Mischung darüber, mit Koriander bestreuen, Limettenspalte dazu.'
    ]
  },
  {
    id:'r26',emoji:'🌶️',name:'Mildes Chili con Carne mit Rinderhack, Kidneybohnen & Mais',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','rind'],
    ing:[
      {n:'Rinderhackfleisch',q:'500',u:'g'},
      {n:'Zwiebel, gehackt',q:'1',u:'Stk'},{n:'Peperoni, gewürfelt',q:'1',u:'Stk'},
      {n:'Knoblauchzehen, gepresst',q:'2',u:'Stk'},
      {n:'Gehackte Tomaten (Dose)',q:'400',u:'g'},{n:'Tomatenmark',q:'1',u:'EL'},
      {n:'Kidneybohnen (Dose, abgetropft)',q:'1',u:'Dose'},{n:'Mais (Dose, abgetropft)',q:'1',u:'Dose'},
      {n:'Paprikapulver edelsüss',q:'1',u:'TL'},{n:'Kreuzkümmel',q:'1',u:'TL'},{n:'Oregano',q:'0.5',u:'TL'},
      {n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''}
    ],
    steps:[
      'Hackfleisch krümelig anbraten, bis keine rohen Stellen mehr sichtbar sind.',
      'Zwiebel, Peperoni und Knoblauch dazugeben, 4–5 Min. mitdünsten.',
      'Paprikapulver, Kreuzkümmel und Oregano einrühren, 1 Min. mitrösten.',
      'Tomatenmark kurz mitrösten, mit gehackten Tomaten ablöschen.',
      'Kidneybohnen und Mais zugeben, 15–18 Min. bei kleiner bis mittlerer Hitze köcheln, bis die Sauce sämig ist. Mit Salz und Pfeffer abschmecken.',
      'In Schalen füllen, nach Wunsch mit Sauerrahm/Crème fraîche und Peterli garnieren; passt auch mit Reis oder Brot.'
    ]
  },
  {
    id:'r27',emoji:'🍚',name:'Sesam-Poulet mit Reis & Edamame',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','poulet','asiatisch'],
    ing:[
      {n:'Pouletbrust, gewürfelt',q:'500',u:'g'},
      {n:'Reis',q:'300',u:'g'},
      {n:'Edamame (TK)',q:'200',u:'g'},{n:'Karotte, in feinen Streifen',q:'1',u:'Stk'},
      {n:'Sojasauce',q:'3',u:'EL'},{n:'Sesamöl',q:'1',u:'EL'},{n:'Sesamsamen',q:'1',u:'EL'},
      {n:'Honig',q:'1',u:'EL'},{n:'Knoblauchzehe, gepresst',q:'1',u:'Stk'}
    ],
    steps:[
      'Reis kochen, Edamame nach Packungsanweisung in Salzwasser garen, abgiessen.',
      'Sojasauce, Honig und Knoblauch verrühren.',
      'Sesamöl erhitzen, Pouletwürfel 6–8 Min. braten, bis komplett durchgegart.',
      'Sauce dazugeben, kurz aufkochen, bis sie leicht glasig am Poulet haftet.',
      'Reis als Basis, Poulet darauf, Edamame und Karottenstreifen daneben anrichten, mit Sesamsamen bestreuen.'
    ]
  },
  {
    id:'r28',emoji:'🍝',name:'Pesto-Pasta mit Kirschtomaten & Mozzarella',cat:'Pasta',time:25,pers:4,
    tags:['mealprep','vegetarisch'],
    ing:[
      {n:'Pasta',q:'400',u:'g'},{n:'Cherrytomaten, halbiert',q:'200',u:'g'},
      {n:'Pesto (Verde oder Rosso, nach Wahl)',q:'150',u:'g'},
      {n:'Mozzarella-Perlen oder gewürfelt',q:'150',u:'g'},{n:'Parmesan (zum Garnieren)',q:'',u:''},
      {n:'Basilikum (zum Garnieren)',q:'',u:''}
    ],
    steps:[
      'Pasta nach Packungsanweisung kochen, abgiessen, etwas Kochwasser aufbewahren.',
      'Cherrytomaten in einer Pfanne 2–3 Min. andünsten, bis die Haut leicht aufplatzt.',
      'Pesto unter die warme Pasta mischen, bei Bedarf mit etwas Kochwasser verdünnen.',
      'Mozzarella und Cherrytomaten unterheben.',
      'In Schalen füllen, mit geriebenem Parmesan und frischem Basilikum bestreuen.'
    ]
  },
  {
    id:'r29',emoji:'🥘',name:'Cremiger Spinat mit Kichererbsen & Feta',cat:'Hauptspeisen',time:30,pers:4,
    tags:['mealprep','vegetarisch'],
    ing:[
      {n:'Blattspinat (TK oder frisch)',q:'500',u:'g'},
      {n:'Kichererbsen (Dosen, abgetropft)',q:'2',u:'Dosen'},
      {n:'Zwiebel, gehackt',q:'1',u:'Stk'},{n:'Knoblauchzehen, gepresst',q:'2',u:'Stk'},
      {n:'Halbrahm',q:'200',u:'ml'},{n:'Muskatnuss',q:'',u:''},{n:'Feta',q:'150',u:'g'},
      {n:'Reis',q:'300',u:'g'}
    ],
    steps:[
      'Reis kochen.',
      'Zwiebel und Knoblauch andünsten.',
      'Kichererbsen dazugeben, 2–3 Min. mitbraten.',
      'Spinat zugeben, mit Halbrahm ablöschen. Mit Muskatnuss, Salz und Pfeffer würzen, 5–8 Min. köcheln bis cremig.',
      'Reis als Basis, Spinat-Kichererbsen-Mischung darüber, mit Feta bestreuen.'
    ]
  },
  {
    id:'r30',emoji:'🥕',name:'Geröstete Gemüse-Quinoa-Bowl mit Feta',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','vegetarisch'],
    ing:[
      {n:'Quinoa',q:'250',u:'g'},
      {n:'Zucchini, gewürfelt',q:'2',u:'Stk'},{n:'Peperoni, in Spalten',q:'2',u:'Stk'},
      {n:'Rote Zwiebel, in Spalten',q:'1',u:'Stk'},
      {n:'Olivenöl',q:'3',u:'EL'},{n:'Getrockneter Oregano',q:'1',u:'TL'},{n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''},
      {n:'Feta',q:'150',u:'g'},{n:'Balsamico-Essig',q:'1',u:'EL'}
    ],
    steps:[
      'Quinoa kurz abspülen, mit der doppelten Menge Wasser aufkochen, zugedeckt bei kleiner Hitze 12–15 Min. köcheln, danach 5 Min. ausquellen lassen.',
      'Ofen auf 220°C vorheizen. Zucchini, Peperoni und Zwiebel mit 2 EL Olivenöl, Oregano, Salz und Pfeffer mischen, auf Blech verteilen.',
      '18–20 Min. rösten, bis das Gemüse weich und an den Rändern leicht gebräunt ist.',
      'Restliches Olivenöl mit Balsamico zum Dressing verrühren.',
      'Quinoa als Basis in die Bowl geben, geröstetes Gemüse darauf anordnen, Feta darüberbröckeln, mit Dressing beträufeln.'
    ]
  },
  {
    id:'r31',emoji:'🧆',name:'Falafel-Bowl mit Hummus & Salat',cat:'Hauptspeisen',time:35,pers:4,
    tags:['mealprep','vegetarisch'],
    ing:[
      {n:'Kichererbsen (Dosen, 1.5 für Falafel, 0.5 für Hummus)',q:'2',u:'Dosen'},
      {n:'Petersilie (für Falafel)',q:'1',u:'Handvoll'},{n:'Knoblauchzehen (für Falafel)',q:'2',u:'Stk'},
      {n:'Kreuzkümmel',q:'1',u:'TL'},{n:'Gemahlener Koriander',q:'1',u:'TL'},{n:'Mehl',q:'2',u:'EL'},
      {n:'Salz',q:'',u:''},{n:'Pfeffer',q:'',u:''},{n:'Öl (zum Braten)',q:'',u:''},
      {n:'Tahin (für den Hummus)',q:'2',u:'EL'},{n:'Knoblauchzehe (für den Hummus)',q:'1',u:'Stk'},
      {n:'Zitronensaft',q:'0.5',u:'Stk'},{n:'Wasser',q:'2-3',u:'EL'},
      {n:'Salatmischung',q:'',u:''},{n:'Cherrytomaten',q:'',u:''},{n:'Gurke',q:'',u:''},
      {n:'Tahin-Zitronen-Dressing (1 EL Tahin, 1 EL Zitronensaft, 2 EL Wasser)',q:'',u:''}
    ],
    steps:[
      'Beide Dosen Kichererbsen abtropfen lassen: 1,5 Dosen für die Falafel abmessen, 0,5 Dosen für den Hummus beiseitestellen.',
      'Für die Falafel: die grössere Kichererbsenmenge mit Petersilie, Knoblauch, Kreuzkümmel, Koriander, Mehl, Salz und Pfeffer im Blitzhacker grob pürieren.',
      'Aus der Masse 12 kleine Bällchen formen, in reichlich Öl bei mittlerer Hitze 3–4 Min. pro Seite goldbraun und knusprig braten.',
      'Für den Hummus: restliche Kichererbsen mit Tahin, Knoblauch, Zitronensaft und Wasser fein pürieren, bis cremig, mit Salz abschmecken.',
      'Hummus als Basis in die Bowl streichen, Salat, Cherrytomaten und Gurke daneben anordnen, Falafel obenauf platzieren, mit dem Zitronen-Tahin-Dressing beträufeln.'
    ]
  },
  {
    id:'r32',emoji:'🍖',name:'Köttbullar (schwedische Fleischbällchen)',cat:'Hauptspeisen',time:35,pers:4,
    tags:['importiert','bettybossi','schwedisch'],
    ing:[
      {n:'Zwiebel',q:'1',u:'Stk'},{n:'Knoblauchzehe',q:'1',u:'Stk'},
      {n:'Glattblättrige Petersilie',q:'1',u:'Bund'},{n:'Olivenöl',q:'0.5',u:'EL'},
      {n:'Hackfleisch (Rind)',q:'500',u:'g'},{n:'Paniermehl',q:'30',u:'g'},
      {n:'Frisches Ei',q:'1',u:'Stk'},{n:'Paprika',q:'2',u:'TL'},
      {n:'Salz',q:'0.75',u:'TL'},{n:'Pfeffer',q:'wenig',u:''},
      {n:'Öl zum Braten',q:'',u:''},
      {n:'Fleischbouillon',q:'2.5',u:'dl'},{n:'Vollrahm',q:'2.5',u:'dl'},
      {n:'Salz, Pfeffer, nach Bedarf',q:'',u:''},{n:'Preiselbeeren aus dem Glas',q:'100',u:'g'}
    ],
    steps:[
      'Zwiebel und Knoblauch schälen, beides fein hacken. Petersilie fein schneiden. Öl in einer beschichteten Bratpfanne warm werden lassen. Zwiebel und Knoblauch ca. 2 Min. andämpfen, Petersilie ca. 2 Min. mitdämpfen, in eine Schüssel geben, etwas abkühlen.',
      'Hackfleisch, Paniermehl, Ei, Paprika, Salz und Pfeffer beigeben, mischen, von Hand gut kneten, bis sich die Zutaten zu einer kompakten Masse verbinden. Masse mit nassen Händen zu ca. 16 Bällchen formen.',
      'Wenig Öl in derselben Bratpfanne heiss werden lassen. Bällchen rundum ca. 8 Min. braten, herausnehmen, beiseite stellen.',
      'Bouillon mit 1.5 dl Rahm in dieselbe Pfanne giessen, aufkochen, Hitze reduzieren, ca. 10 Min. einkochen, würzen. Restlichen Rahm flaumig schlagen, unter die Sauce ziehen. Bällchen wieder beigeben, nur noch heiss werden lassen, mit den Preiselbeeren anrichten.'
    ]
  },
  {
    id:'r33',emoji:'🍚',name:'Tomatenreis-One-Pot',cat:'Hauptspeisen',time:30,pers:4,
    tags:['importiert','bettybossi','vegetarisch'],
    ing:[
      {n:'Zwiebel',q:'1',u:'Stk'},{n:'Knoblauchzehe',q:'1',u:'Stk'},
      {n:'Tomaten',q:'800',u:'g'},{n:'Kidney-Bohnen (ca. 290g)',q:'1',u:'Dose'},
      {n:'Langkornreis (Parboiled)',q:'300',u:'g'},{n:'Olivenöl',q:'1',u:'EL'},
      {n:'Tomatenpüree',q:'1',u:'EL'},{n:'Gemüsebouillon',q:'5',u:'dl'},
      {n:'Pfeffer',q:'0.25',u:'TL'},{n:'Glattblättrige Petersilie',q:'1',u:'Bund'}
    ],
    steps:[
      'Zwiebel und Knoblauch schälen, grob hacken, Tomaten in Stücke schneiden. Bohnen abspülen, abtropfen, alles in eine weite Pfanne geben.',
      'Reis, Öl, Tomatenpüree und Bouillon daruntermischen, würzen, aufkochen, zugedeckt unter gelegentlichem Rühren bei mittlerer Hitze ca. 20 Min. kochen.',
      'Petersilie grob schneiden, unter den Tomatenreis mischen.'
    ]
  },
  {
    id:'r34',emoji:'🍝',name:'Spaghetti mit Spinat und Lachs',cat:'Pasta',time:20,pers:4,
    tags:['importiert','bettybossi','lachs'],
    ing:[
      {n:'Spaghetti',q:'400',u:'g'},{n:'Salzwasser, siedend',q:'',u:''},
      {n:'Olivenöl',q:'2',u:'EL'},{n:'Jungspinat oder Rucola',q:'150',u:'g'},
      {n:'Bio-Zitrone',q:'1',u:'Stk'},{n:'Salz',q:'0.5',u:'TL'},{n:'Pfeffer',q:'wenig',u:''},
      {n:'Rahm',q:'2',u:'dl'},{n:'Geräucherter Lachs in Tranchen',q:'100',u:'g'}
    ],
    steps:[
      'Spaghetti im Salzwasser al dente kochen, ca. 2 dl Kochwasser beiseite stellen, Spaghetti abtropfen, zurück in die Pfanne geben. Öl, Spinat und Kochwasser beigeben, mischen.',
      'Von der Zitrone Schale abreiben und den Saft auspressen. Saft beigeben, würzen.',
      'Rahm mit der Zitronenschale flaumig schlagen, unter die Spaghetti mischen. Lachs in ca. 2cm breite Streifen schneiden, darauf anrichten.'
    ]
  }
];

const SK = 'heimplaner_v3';
const DS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const DL = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const CATS = ['Früchte & Gemüse','Kühlwaren','Fleisch & Fisch','Backwaren','Getränke','Haushalt','Tiefkühl','Vorrat','Sonstiges'];
const CAT_EMOJI = {'Früchte & Gemüse':'🥦','Kühlwaren':'🧀','Fleisch & Fisch':'🥩','Backwaren':'🍞','Getränke':'🥤','Haushalt':'🧹','Tiefkühl':'❄️','Vorrat':'🥫','Sonstiges':'📦'};

const BUDGET_CATS = ['Restaurant','Lieferservice','Events, Ausgang','Geschenke','Transport','Sonstiges'];
const BUDGET_CAT_EMOJI = {'Restaurant':'🍽️','Lieferservice':'🛵','Events, Ausgang':'🎉','Geschenke':'🎁','Transport':'🚗','Sonstiges':'🧺'};

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
      if (!d.birthdays) d.birthdays = [];
      if (!d.taskComments) d.taskComments = {};
      if (!d.eventStatus) d.eventStatus = {};
      if (!d.eventNotes) d.eventNotes = {};
      if (!d.eventComments) d.eventComments = {};
      if (!d.savedShopItems) d.savedShopItems = [];
      if (!d.taskExceptions) d.taskExceptions = {};
      if (!d.budgetEntries) d.budgetEntries = [];
      if (!d.budgetLimits) d.budgetLimits = {p1:{}, p2:{}};
      if (!d.deleted) d.deleted = {};
      // ensure important field on all tasks
      ['p1','p2','shared'].forEach(w => {
        d.tasks[w] = d.tasks[w].map(t => ({important:false,...t}));
      });
      migrateBuiltinRecipes(d);
      return d;
    }
  } catch(e) {}
  const fresh = {
    tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    names: {p1:'Mauro', p2:'Melissa'},
    colors: {...DEFAULT_COLORS},
    theme: 'dark',
    done: {}, taskStatus: {}, taskNotes: {},
    shop: [], meals: {}, notes: [], customRecipes: [],
    events: [], birthdays: [], taskComments: {},
    eventStatus: {}, eventNotes: {}, eventComments: {},
    savedShopItems: [], taskExceptions: {},
    budgetEntries: [], budgetLimits: {p1:{}, p2:{}},
    deleted: {}
  };
  migrateBuiltinRecipes(fresh);
  return fresh;
}

// Einmalige Migration: überführt die vormals fest im Code stehenden RECIPES
// in den editierbaren/synchronisierten Zustand (HP.customRecipes), damit sie
// über die "Bearbeiten"-Funktion änderbar werden. Läuft dank recipesMigrated-
// Flag nur genau einmal — sonst würde ein später bewusst gelöschtes Rezept
// beim nächsten Laden aus RECIPES wiederhergestellt.
function migrateBuiltinRecipes(d) {
  if (d.recipesMigrated) return;
  const existingIds = new Set((d.customRecipes||[]).map(r=>r.id));
  RECIPES.forEach(r => { if (!existingIds.has(r.id)) d.customRecipes.push({...r, custom:true}); });
  d.recipesMigrated = true;
}

function HP_save() {
  try { localStorage.setItem(SK, JSON.stringify(HP)); } catch(e) {}
}

// Tombstone für eine gelöschte ID hinterlegen, damit ein Sync-Merge sie nicht
// aus einem noch nicht aktualisierten Server-/Geräte-Stand wiederherstellt.
// type = 'events'|'notes'|'birthdays'|'shop'|'savedShopItems'|'customRecipes'|'budgetEntries'|'tasks'
function markDeleted(type, id) {
  if (!HP.deleted) HP.deleted = {};
  if (!HP.deleted[type]) HP.deleted[type] = {};
  HP.deleted[type][id] = Date.now();
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
function taskOccursOn(t,dateKey) {
  const di=(new Date(dateKey+'T12:00:00').getDay()+6)%7;
  if(!t.days.includes(di)) return false;
  if(HP.taskExceptions && HP.taskExceptions[t.id] && HP.taskExceptions[t.id][dateKey]) return false;
  return true;
}
function getStatus(tid) { return HP.taskStatus[tid]||'open'; }
function getEventStatus(eid) { return (HP.eventStatus||{})[eid]||'open'; }
function fmtTime(t) { if(!t)return '';const[h,m]=t.split(':');return h+':'+m; }
function fmtTimeRange(start,end) { if(!start)return ''; return end?fmtTime(start)+'–'+fmtTime(end):fmtTime(start); }
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
// RECIPES dient nur noch als Migrationsquelle (siehe migrateBuiltinRecipes) —
// die eigentlichen Rezepte leben nach der einmaligen Migration in customRecipes,
// wo sie bearbeitbar/löschbar sind und über den Sync-Mechanismus laufen.
function allRecipes() { return HP.customRecipes||[]; }
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

// ── Haushalt: wiederkehrende Termine ──────────────────
const CHORE_INTERVALS = [
  ['weeks:1','Wöchentlich'],['weeks:2','Alle 2 Wochen'],
  ['months:1','Monatlich'],['months:3','Vierteljährlich'],
  ['months:6','Halbjährlich'],['months:12','Jährlich']
];
const NTH_LABELS={1:'1.',2:'2.',3:'3.',4:'4.','-1':'letzter'};
function recurLabel(recur) {
  if(!recur) return '';
  const key=recur.unit+':'+recur.value;
  const f=CHORE_INTERVALS.find(([k])=>k===key);
  const base=f ? f[1] : recur.unit+' '+recur.value;
  if(recur.weekday!=null && recur.nth!=null) {
    return base+' · '+(NTH_LABELS[recur.nth]||recur.nth)+' '+(DL[recur.weekday]||'');
  }
  return base;
}
// nth (1-4) or letzter (-1) Wochentag (0=Mo..6=So) eines Monats
function nthWeekdayOfMonth(year, monthIndex0, weekday, nth) {
  if(nth===-1) {
    const last=new Date(Date.UTC(year,monthIndex0+1,0));
    const lastDow=(last.getUTCDay()+6)%7;
    last.setUTCDate(last.getUTCDate()-((lastDow-weekday+7)%7));
    return last;
  }
  const first=new Date(Date.UTC(year,monthIndex0,1));
  const firstDow=(first.getUTCDay()+6)%7;
  const day=1+((weekday-firstDow+7)%7)+(nth-1)*7;
  return new Date(Date.UTC(year,monthIndex0,day));
}
function advanceDateKey(dateKey, unit, value, weekday, nth) {
  const [y,m,d]=dateKey.split('-').map(Number);
  if(unit==='weeks') {
    const dt=new Date(Date.UTC(y,m-1,d));
    dt.setUTCDate(dt.getUTCDate()+value*7);
    return dt.toISOString().slice(0,10);
  }
  const total=(m-1)+value, ny=y+Math.floor(total/12), nm=(total%12)+1;
  if(weekday!=null && nth!=null) {
    return nthWeekdayOfMonth(ny,nm-1,weekday,nth).toISOString().slice(0,10);
  }
  const lastDay=new Date(Date.UTC(ny,nm,0)).getUTCDate();
  const nd=Math.min(d,lastDay);
  return ny+'-'+String(nm).padStart(2,'0')+'-'+String(nd).padStart(2,'0');
}

// Farbe einer Person/Kategorie holen
function getColor(who) {
  return (HP.colors && HP.colors[who]) || DEFAULT_COLORS[who] || '#6C8EFF';
}
function getColorBg(who) {
  const val = getColor(who);
  const opt = COLOR_OPTIONS.find(c=>c.val===val);
  return opt ? opt.bg : 'rgba(108,142,255,0.12)';
}

// ── Budget ───────────────────────────────────
function monthKey(dateStr) { return (dateStr||'').slice(0,7); }
function currentMonthKey(off=0) {
  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+off);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
const MONTH_NAMES=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function monthLabel(mk) {
  const [y,m]=mk.split('-').map(Number);
  return MONTH_NAMES[m-1]+' '+y;
}
function fmtCHF(n) {
  n=Math.round((n||0)*100)/100;
  return Number.isInteger(n) ? n+'.-' : n.toFixed(2);
}
function budgetEntriesFor(person,mk) {
  return (HP.budgetEntries||[]).filter(e=>e.person===person&&monthKey(e.date)===mk);
}
function budgetLimit(person,cat) {
  return (HP.budgetLimits&&HP.budgetLimits[person]&&HP.budgetLimits[person][cat])||0;
}
function loggedInPersonKey() {
  const u=(typeof getLoggedInUser==='function'&&getLoggedInUser()||'').toLowerCase();
  return u==='melissa' ? 'p2' : 'p1';
}

// Initialise global state
const HP = loadState();