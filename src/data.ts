import { Product, Review } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'zw-01',
    name: 'ZEWKA Premium Wool Overcoat',
    nameAr: 'معطف زيوكا الصوفي الفاخر',
    description: 'An elegant long overcoat tailored from premium double-faced merino wool. Features a structured silhouette, double-breasted closure, and deep welt pockets.',
    descriptionAr: 'معطف طويل أنيق مصنوع بدقة من صوف الميرينو الفاخر ذو الوجهين. يتميز بقصة هيكلية ممتازة، وإغلاق مزدوج الصدر، وجيوب عميقة أنيقة.',
    price: 289,
    category: 'apparel',
    categoryAr: 'الملابس والموضة',
    rating: 4.8,
    reviewsCount: 14,
    image: 'https://picsum.photos/seed/overcoat/600/800',
    stock: 5,
    isFeatured: true,
    features: [
      '100% Merino Wool fabric',
      'Hand-stitched structural seams',
      'Premium horn-style buttons',
      'Suitable for temperatures down to -5°C'
    ],
    featuresAr: [
      'صوف ميرينو طبيعي 100%',
      'درزات هيكلية مخيطة يدويًا',
      'أزرار فاخرة بتأثير عاجي',
      'مناسب لدرجات حرارة منخفضة تصل إلى -5 مئوية'
    ],
    specs: {
      'Material': '100% Merino Wool',
      'Fit': 'Tailored / Structured',
      'Origin': 'Made in Italy',
      'Care': 'Dry Clean Only'
    },
    specsAr: {
      'المادة': 'صوف ميرينو 100%',
      'القصة': 'مفصلة / هيكلية',
      'المنشأ': 'صنع في إيطاليا',
      'العناية': 'تنظيف جاف فقط'
    }
  },
  {
    id: 'zw-02',
    name: 'ZEWKA Luxury Leather Shoulder Bag',
    nameAr: 'حقيبة الكتف الجلدية الفاخرة',
    description: 'Crafted from full-grain calfskin leather with a butter-soft finish. Complete with custom gold-toned hardware and an adjustable shoulder strap.',
    descriptionAr: 'مصنوعة من جلد العجل الطبيعي الكامل بنسيج ناعم كالزبدة. مكتملة بإكسسوارات ذهبية مخصصة وحزام كتف قابل للتعديل.',
    price: 189,
    category: 'apparel',
    categoryAr: 'الملابس والموضة',
    rating: 4.9,
    reviewsCount: 22,
    image: 'https://picsum.photos/seed/leatherbag/600/800',
    stock: 8,
    isFeatured: true,
    features: [
      'Full-grain calfskin leather',
      'Hand-painted leather edges',
      'Internal zippered security pocket',
      'Suede-lined interior'
    ],
    featuresAr: [
      'جلد عجل طبيعي بالكامل',
      'حواف جلدية مطلية يدويًا',
      'جيب داخلي بسحاب للأمان',
      'بطانة داخلية من الجلد السويدي الفاخر'
    ],
    specs: {
      'Material': 'Calfskin Leather',
      'Dimensions': '24cm x 16cm x 8cm',
      'Hardware': '24k Gold-plated Brass',
      'Strap Drop': '45cm - 55cm'
    },
    specsAr: {
      'المادة': 'جلد عجل طبيعي',
      'الأبعاد': '24سم × 16سم × 8سم',
      'الإكسسوارات': 'نحاس مطلي بذهب عيار 24',
      'طول الحزام': '45سم - 55سم'
    }
  },
  {
    id: 'zw-03',
    name: 'ZEWKA "Naseem" Signature Perfume',
    nameAr: 'عطر "نسيم زيوكا" الخاص',
    description: 'An ethereal blend of damask rose, warm sandalwood, and subtle hints of spicy cardamom. A lingering scent that defines understated sophistication.',
    descriptionAr: 'مزيج أثيري من الورد الدمشقي، وخشب الصندل الدافئ، ولمسات خفيفة من الهيل الحار. عطر يدوم طويلاً يجسد الأناقة والجاذبية الهادئة.',
    price: 119,
    category: 'wellness',
    categoryAr: 'العناية والعطور',
    rating: 4.7,
    reviewsCount: 31,
    image: 'https://picsum.photos/seed/perfume/600/800',
    stock: 12,
    isFeatured: true,
    features: [
      'Extrait de Parfum concentration (30% oils)',
      'Sourced from organic botanical ingredients',
      'Custom heavy-glass flacon',
      'Unisex profile'
    ],
    featuresAr: [
      'تركيز عالي جداً (Extrait de Parfum - زيت 30%)',
      'مستخلص من مكونات نباتية عضوية نقية',
      'زجاجة فاخرة ثقيلة الوزن بتصميم فريد',
      'يناسب الجنسين (Unisex)'
    ],
    specs: {
      'Volume': '100ml / 3.4 fl. oz.',
      'Scent Family': 'Woody / Floral / Spicy',
      'Longevity': 'Up to 12 hours',
      'Top Notes': 'Cardamom, Pink Pepper'
    },
    specsAr: {
      'الحجم': '100 مل / 3.4 أونصة سائلة',
      'عائلة العطر': 'خشبي / زهري / توابل',
      'الثبات': 'يصل إلى 12 ساعة',
      'المكونات العليا': 'الهيل، الفلفل الوردي'
    }
  },
  {
    id: 'zw-04',
    name: 'ZEWKA Calming Aromatherapy Candle',
    nameAr: 'شمعة الصويا المهدئة للعلاج العطري',
    description: 'Hand-poured natural soy wax candle infused with lavender, bergamot, and cedarwood essential oils. Encased in a beautiful ceramic vessel.',
    descriptionAr: 'شمعة مصبوبة يدويًا من شمع الصويا الطبيعي المشبع بالزيوت الأساسية لللافندر والبرغموت وخشب الأرز. تأتي في وعاء سيراميكي رائع.',
    price: 45,
    category: 'wellness',
    categoryAr: 'العناية والعطور',
    rating: 4.6,
    reviewsCount: 18,
    image: 'https://picsum.photos/seed/candle/600/800',
    stock: 15,
    features: [
      '100% biodegradable soy wax',
      'Lead-free organic cotton wick',
      'Refillable ceramic holder',
      'Over 50 hours of clean burn time'
    ],
    featuresAr: [
      'شمع صويا طبيعي 100% قابل للتحلل',
      'فتيل من القطن العضوي الخالي من الرصاص',
      'وعاء سيراميك مميز قابل لإعادة التعبئة والاستخدام',
      'زمن احتراق نظيف يتجاوز 50 ساعة'
    ],
    specs: {
      'Weight': '280g / 9.8 oz',
      'Burn Time': '50 - 55 Hours',
      'Wax Type': 'Pure Soy Wax',
      'Vessel': 'Handmade Ceramic'
    },
    specsAr: {
      'الوزن': '280 جرام / 9.8 أونصة',
      'زمن الاحتراق': '50 - 55 ساعة',
      'نوع الشمع': 'شمع صويا نقي',
      'الوعاء': 'سيراميك مصنوع يدويًا'
    }
  },
  {
    id: 'zw-05',
    name: 'ZEWKA Handcrafted Ceramic Cup Set',
    nameAr: 'طقم أكواب السيراميك المصنوع يدويًا',
    description: 'A pair of wabi-sabi inspired coffee cups. Hand-thrown on a potters wheel and finished with an earthy, dual-tone reactive glaze.',
    descriptionAr: 'زوج من أكواب القهوة المستوحاة من فلسفة "الوابي-صابي" اليابانية للجمال الطبيعي. تم تشكيلها يدويًا على عجلة الفخار ومطلية بطبقة مزدوجة فريدة.',
    price: 59,
    category: 'home',
    categoryAr: 'المنزل العصري',
    rating: 4.9,
    reviewsCount: 27,
    image: 'https://picsum.photos/seed/ceramics/600/800',
    stock: 4,
    features: [
      'Individually thrown by ceramic artists',
      'Microwave and dishwasher safe',
      'Ergonomic dual-finger handle',
      'Heat-retaining thick clay body'
    ],
    featuresAr: [
      'مصنوعة بشكل منفرد على يد فنانين محترفين',
      'آمنة للاستخدام في المايكرويف وغسالة الأطباق',
      'مقبض مريح ومناسب للإصبعين',
      'هيكل طيني سميك يحتفظ بحرارة المشروب'
    ],
    specs: {
      'Quantity': '2 Cups per set',
      'Capacity': '250ml / 8.5 oz each',
      'Finish': 'Reactive Dual Glaze',
      'Material': 'Earthenware Clay'
    },
    specsAr: {
      'الكمية': 'كوبان في الطقم الواحد',
      'السعة': '250 مل لكل كوب',
      'الطلاء': 'طبقة زجاجية تفاعلية مزدوجة',
      'المادة': 'طين الفخار الطبيعي'
    }
  },
  {
    id: 'zw-06',
    name: 'ZEWKA Leather Earbuds Case Cover',
    nameAr: 'غلاف سماعات الأذن الجلدي الفاخر',
    description: 'A stylish and protective leather cover designed for wireless earbuds. Includes a solid brass carabiner to clip securely onto bags or loops.',
    descriptionAr: 'غلاف جلدي أنيق وواقٍ مصمم لسماعات الأذن اللاسلكية. يتضمن حلقة معدنية (كارابينر) من النحاس الصلب لتعليقها بأمان في الحقائب.',
    price: 35,
    category: 'tech',
    categoryAr: 'إكسسوارات تقنية',
    rating: 4.5,
    reviewsCount: 42,
    image: 'https://picsum.photos/seed/earbudscase/600/800',
    stock: 20,
    features: [
      'Italian vegetable-tanned leather',
      'Cutout for charging ports',
      'Snug, secure anti-slip fit',
      'Solid brass heavy carabiner'
    ],
    featuresAr: [
      'جلد إيطالي مدبوغ بمواد نباتية طبيعية',
      'فتحة مخصصة لمنفذ الشحن وضوء المؤشر',
      'قياس محكم لمنع انزلاق السماعة',
      'حلقة تعليق نحاسية متينة وثقيلة'
    ],
    specs: {
      'Leather Type': 'Vegetable-Tanned',
      'Hardware': 'Solid Brushed Brass',
      'Compatibility': 'Universal Earbuds Style',
      'Stitching': 'Heavy Polyester Thread'
    },
    specsAr: {
      'نوع الجلد': 'مدبوغ نباتياً',
      'المعادن': 'نحاس صلب مطفي',
      'التوافق': 'طراز متوافق مع السماعات اللاسلكية',
      'الخياطة': 'خيوط بوليستر متينة جداً'
    }
  },
  {
    id: 'zw-07',
    name: 'ZEWKA Merino Wool Desk Mat',
    nameAr: 'لبادة المكتب الفاخرة من صوف الميرينو',
    description: 'Protect your workspace with this thick, anti-slip desk mat. Sourced from organic felted merino wool for unparalleled mouse tracking and comfort.',
    descriptionAr: 'احمِ مساحة عملك مع لبادة المكتب السميكة المضادة للانزلاق. مصنوعة من لباد صوف الميرينو العضوي لتمنحك دقة تتبع وراحة فائقة.',
    price: 75,
    category: 'tech',
    categoryAr: 'إكسسوارات تقنية',
    rating: 4.7,
    reviewsCount: 15,
    image: 'https://picsum.photos/seed/deskmat/600/800',
    stock: 6,
    features: [
      'Natural water-resistant wool felt',
      'Non-slip cork backing material',
      'Sound-dampening workspace acoustics',
      'Precision stitched anti-fray border'
    ],
    featuresAr: [
      'لباد صوف طبيعي مقاوم لقطرات الماء والأوساخ',
      'قاعدة مضادة للانزلاق من الفلين الطبيعي',
      'عزل الصوت وامتصاص ذبذبات الكيبورد والمكتب',
      'حواف مخيطة بدقة لمنع التلف والتنسل'
    ],
    specs: {
      'Dimensions': '80cm x 30cm x 0.4cm',
      'Materials': 'Merino Wool Felt & Cork',
      'Texture': 'Soft Felted',
      'Weight': '420g'
    },
    specsAr: {
      'الأبعاد': '80سم × 30سم × 0.4سم',
      'المكونات': 'لباد صوف الميرينو والفلين',
      'الملمس': 'لباد ناعم ومريح',
      'الوزن': '420 جرام'
    }
  },
  {
    id: 'zw-08',
    name: 'ZEWKA Pure Mulberry Silk Sleep Mask',
    nameAr: 'قناع النوم الفاخر من حرير التوت الطبيعي',
    description: 'Experience pure restoration. Made from pure mulberry silk, this double-padded sleep mask blocks out 100% light while nurturing delicate facial skin.',
    descriptionAr: 'استمتع بنوم عميق ومريح للغاية. قناع نوم مصنوع من حرير التوت الطبيعي الفاخر بنسبة 100% يحجب الضوء بالكامل ويحافظ على نضارة بشرة الوجه.',
    price: 49,
    category: 'wellness',
    categoryAr: 'العناية والعطور',
    rating: 4.8,
    reviewsCount: 19,
    image: 'https://picsum.photos/seed/sleepmask/600/800',
    stock: 10,
    features: [
      '100% Grade 6A Mulberry Silk',
      'Naturally hypoallergenic',
      'Adjustable elastic silk-wrapped strap',
      'Gentle pressure relief'
    ],
    featuresAr: [
      'حرير التوت الطبيعي بنسبة 100% درجة 6A',
      'مقاوم طبيعي للحساسية والروائح',
      'حزام مطاطي مغطى بالحرير قابل للتعديل لتجنب شد الشعر',
      'تصميم مريح يقلل الضغط على العينين'
    ],
    specs: {
      'Material': '100% Mulberry Silk (22 Momme)',
      'Fill': '100% Silk Floss',
      'Light Blocking': '100% Total Blackout',
      'Includes': 'Travel storage pouch'
    },
    specsAr: {
      'المادة': 'حرير التوت الطبيعي 100% (سمك 22 مومي)',
      'الحشوة': 'خيوط حرير طبيعي 100%',
      'حجب الضوء': 'تعتيم تام وحجب للضوء بنسبة 100%',
      'يحتوي على': 'حقيبة تخزين حريرية مخصصة للسفر'
    }
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-01',
    userName: 'سارة الأحمد',
    rating: 5,
    comment: 'المعطف الصوفي غاية في الفخامة والأناقة! الخامة دافئة جداً وملمس الصوف ناعم كالحرير، الخياطة متقنة للغاية وتضاهي الماركات العالمية.',
    date: '2026-06-25',
    tags: ['جودة ممتازة', 'خامة دافئة', 'قصة مريحة'],
    merchantResponse: 'نشكركِ جداً سارة على رأيكِ الرائع! نسعى دائماً في زيوكا لتقديم قطع صوفية فاخرة تدوم طويلاً وتمنحك الأناقة التي تستحقينها.'
  },
  {
    id: 'rev-02',
    userName: 'خالد العنزي',
    rating: 5,
    comment: 'اشتريت حقيبة الكتف الجلدية لزوجتي كهدية، الجلد طبيعي ورائحته تدل على أصالته والتقفيل مذهل. التغليف فخم جداً ومناسب للهدايا.',
    date: '2026-06-28',
    tags: ['مناسب للهدايا', 'جلد طبيعي 100%'],
    merchantResponse: 'يسعدنا جداً أن الهدية نالت إعجاب زوجتكِ يا أستاذ خالد! نهتم بأدق التفاصيل من جودة الجلود إلى فخامة صندوق التغليف.'
  },
  {
    id: 'rev-03',
    userName: 'منيرة السعيد',
    rating: 4,
    comment: 'عطر "نسيم" فخم للغاية وله رائحة خشبية ترابية جميلة مع لمحة هيل جذابة، الثبات رائع ويدوم اليوم كله ولكن السعر مرتفع قليلاً.',
    date: '2026-07-02',
    tags: ['رائحة ساحرة', 'ثبات قوي'],
    merchantResponse: 'أهلاً بكِ منيرة! عطر نسيم يحتوي على نسبة عالية من الزيوت العطرية العضوية النادرة بتركيز Extrait de Parfum وهو سبب سعره، نسعد دائماً بخدمتكِ.'
  }
];

export const COUPONS: Record<string, number> = {
  'ZEWKA10': 0.10, // 10% off
  'ZEWKA20': 0.20, // 20% off
  'WELCOME30': 0.30, // 30% off
  'VIP40': 0.40 // 40% off
};
