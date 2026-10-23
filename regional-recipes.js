// Original, simplified home versions of regional dishes; no external recipe API.
export const CUISINES = [
  {
    "id": "home",
    "name": "家常菜",
    "region": "日常餐桌",
    "description": "保留最初的 12 道家常菜，食材常见，做法易上手。"
  },
  {
    "id": "lu",
    "name": "鲁菜",
    "region": "山东",
    "description": "咸鲜醇厚，善用葱香，讲究制汤、烧焖与爆炒。"
  },
  {
    "id": "chuan",
    "name": "川菜",
    "region": "四川与重庆一带",
    "description": "复合调味丰富，麻辣之外，也有鱼香、蒜泥与鲜香风味。"
  },
  {
    "id": "yue",
    "name": "粤菜",
    "region": "广东",
    "description": "注重食材鲜味，常用清蒸、白灼、煲汤与烧味技法。"
  },
  {
    "id": "su",
    "name": "苏菜",
    "region": "江苏",
    "description": "口味鲜和，刀工细致，擅长炖焖、清汤与江鲜菜肴。"
  },
  {
    "id": "min",
    "name": "闽菜",
    "region": "福建",
    "description": "山海食材相融，重汤提鲜，善用红糟、酸甜与沙茶风味。"
  },
  {
    "id": "zhe",
    "name": "浙菜",
    "region": "浙江",
    "description": "清鲜细嫩，重视时令，常见茶香、醋香与笋鲜。"
  },
  {
    "id": "xiang",
    "name": "湘菜",
    "region": "湖南",
    "description": "鲜辣酸香，善用剁椒与腊味，炒、蒸、焖各有特色。"
  },
  {
    "id": "hui",
    "name": "徽菜",
    "region": "安徽徽州及周边",
    "description": "山野食材丰富，擅长烧炖与蒸，重视火功和咸鲜本味。"
  }
];
export const REGIONAL_INGREDIENTS = {
  "cucumber": {
    "name": "黄瓜",
    "unit": "g",
    "allergens": []
  },
  "sea-cucumber": {
    "name": "已泡发可烹饪海参",
    "unit": "g",
    "allergens": []
  },
  "carp": {
    "name": "去鳞去内脏鲤鱼块",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "intestine": {
    "name": "正规熟食猪大肠",
    "unit": "g",
    "allergens": []
  },
  "wood-ear": {
    "name": "干木耳",
    "unit": "g",
    "allergens": []
  },
  "lamb": {
    "name": "羊腿肉",
    "unit": "g",
    "allergens": []
  },
  "minced-pork": {
    "name": "猪肉末",
    "unit": "g",
    "allergens": []
  },
  "cabbage": {
    "name": "大白菜",
    "unit": "g",
    "allergens": []
  },
  "mackerel": {
    "name": "去刺鲅鱼肉",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "chives": {
    "name": "韭菜",
    "unit": "g",
    "allergens": []
  },
  "wrappers": {
    "name": "饺子皮",
    "unit": "g",
    "allergens": [
      "gluten"
    ]
  },
  "pucai": {
    "name": "鲜蒲菜",
    "unit": "g",
    "allergens": []
  },
  "milk": {
    "name": "牛奶",
    "unit": "g",
    "allergens": [
      "milk"
    ]
  },
  "chicken-leg": {
    "name": "带骨鸡腿块",
    "unit": "g",
    "allergens": []
  },
  "kidney": {
    "name": "去腰臊猪腰",
    "unit": "g",
    "allergens": []
  },
  "belly": {
    "name": "猪五花肉",
    "unit": "g",
    "allergens": []
  },
  "dried-shrimp": {
    "name": "干海米",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "sugar": {
    "name": "白糖",
    "unit": "g",
    "allergens": []
  },
  "dark-soy": {
    "name": "老抽（核对配料）",
    "unit": "g",
    "allergens": [
      "soy",
      "gluten"
    ]
  },
  "rice-wine": {
    "name": "料酒",
    "unit": "g",
    "allergens": []
  },
  "star-anise": {
    "name": "八角",
    "unit": "g",
    "allergens": []
  },
  "cinnamon": {
    "name": "桂皮",
    "unit": "g",
    "allergens": []
  },
  "peppercorn": {
    "name": "花椒",
    "unit": "g",
    "allergens": []
  },
  "dried-chili": {
    "name": "干辣椒",
    "unit": "g",
    "allergens": []
  },
  "bean-paste": {
    "name": "豆瓣酱（核对配料）",
    "unit": "g",
    "allergens": [
      "soy",
      "gluten"
    ]
  },
  "peanuts": {
    "name": "熟花生米",
    "unit": "g",
    "allergens": [
      "peanut"
    ]
  },
  "beef": {
    "name": "牛里脊",
    "unit": "g",
    "allergens": []
  },
  "sprouts": {
    "name": "豆芽",
    "unit": "g",
    "allergens": []
  },
  "celery": {
    "name": "芹菜",
    "unit": "g",
    "allergens": []
  },
  "pickled-greens": {
    "name": "酸菜（核对配料）",
    "unit": "g",
    "allergens": []
  },
  "snakehead": {
    "name": "去刺黑鱼片",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "beans": {
    "name": "四季豆",
    "unit": "g",
    "allergens": []
  },
  "vermicelli": {
    "name": "干粉丝",
    "unit": "g",
    "allergens": []
  },
  "sesame": {
    "name": "熟白芝麻",
    "unit": "g",
    "allergens": [
      "sesame"
    ]
  },
  "chili-oil": {
    "name": "辣椒油（核对配料）",
    "unit": "g",
    "allergens": [
      "sesame"
    ]
  },
  "ribs": {
    "name": "猪排骨",
    "unit": "g",
    "allergens": []
  },
  "black-bean": {
    "name": "豆豉",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "pork-neck": {
    "name": "猪梅花肉",
    "unit": "g",
    "allergens": []
  },
  "honey": {
    "name": "蜂蜜",
    "unit": "g",
    "allergens": []
  },
  "oyster": {
    "name": "蚝油（核对配料）",
    "unit": "g",
    "allergens": [
      "shellfish",
      "soy",
      "gluten"
    ]
  },
  "seabass": {
    "name": "去鳞去内脏鲈鱼",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "shrimp": {
    "name": "鲜虾",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "scallops": {
    "name": "清理后的扇贝肉",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "lily": {
    "name": "鲜百合",
    "unit": "g",
    "allergens": []
  },
  "pineapple": {
    "name": "菠萝",
    "unit": "g",
    "allergens": []
  },
  "ketchup": {
    "name": "番茄酱（核对配料）",
    "unit": "g",
    "allergens": []
  },
  "rice-noodles": {
    "name": "鲜河粉",
    "unit": "g",
    "allergens": []
  },
  "raw-rice": {
    "name": "大米（生重）",
    "unit": "g",
    "allergens": []
  },
  "sausage": {
    "name": "广式腊肠",
    "unit": "g",
    "allergens": []
  },
  "baby-cabbage": {
    "name": "娃娃菜",
    "unit": "g",
    "allergens": []
  },
  "preserved-egg": {
    "name": "正规即食皮蛋",
    "unit": "个",
    "allergens": [
      "egg"
    ]
  },
  "soft-tofu": {
    "name": "嫩豆腐",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "mandarin-fish": {
    "name": "去骨带皮鳜鱼肉",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "eel": {
    "name": "正规商家宰杀去骨鳝鱼",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "tofu-sheets": {
    "name": "豆腐干丝",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "ham": {
    "name": "熟火腿",
    "unit": "g",
    "allergens": []
  },
  "duck": {
    "name": "带骨鸭肉块",
    "unit": "g",
    "allergens": []
  },
  "biluochun": {
    "name": "碧螺春茶叶",
    "unit": "g",
    "allergens": []
  },
  "crab-meat": {
    "name": "熟蟹肉",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "flour": {
    "name": "小麦面粉",
    "unit": "g",
    "allergens": [
      "gluten"
    ]
  },
  "lard": {
    "name": "猪油",
    "unit": "g",
    "allergens": []
  },
  "red-lees": {
    "name": "正规商用红糟",
    "unit": "g",
    "allergens": []
  },
  "oyster-meat": {
    "name": "清洗后的海蛎肉",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "sweet-starch": {
    "name": "红薯淀粉",
    "unit": "g",
    "allergens": []
  },
  "conch": {
    "name": "商家清理的鲜螺片",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "clams": {
    "name": "吐沙洗净海蚌",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "crab": {
    "name": "清理后的青蟹块",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "sticky-rice": {
    "name": "糯米（生重）",
    "unit": "g",
    "allergens": []
  },
  "chestnut": {
    "name": "去壳板栗",
    "unit": "g",
    "allergens": []
  },
  "lotus-seed": {
    "name": "去芯莲子",
    "unit": "g",
    "allergens": []
  },
  "shacha": {
    "name": "沙茶酱（核对配料）",
    "unit": "g",
    "allergens": [
      "peanut",
      "shellfish",
      "fish",
      "soy"
    ]
  },
  "taro": {
    "name": "去皮芋头",
    "unit": "g",
    "allergens": []
  },
  "red-bean": {
    "name": "即食红豆沙",
    "unit": "g",
    "allergens": []
  },
  "longjing": {
    "name": "龙井茶叶",
    "unit": "g",
    "allergens": []
  },
  "tofu-skin": {
    "name": "干豆腐皮",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "bamboo": {
    "name": "鲜竹笋",
    "unit": "g",
    "allergens": []
  },
  "yellow-croaker": {
    "name": "去鳞去内脏黄鱼",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "snow-greens": {
    "name": "雪菜",
    "unit": "g",
    "allergens": []
  },
  "glutinous-flour": {
    "name": "糯米粉",
    "unit": "g",
    "allergens": []
  },
  "black-sesame": {
    "name": "熟黑芝麻粉",
    "unit": "g",
    "allergens": [
      "sesame"
    ]
  },
  "zaolu": {
    "name": "正规熟制糟卤（核对配料）",
    "unit": "g",
    "allergens": []
  },
  "dried-greens": {
    "name": "梅干菜",
    "unit": "g",
    "allergens": []
  },
  "fermented-chili": {
    "name": "剁椒（核对配料）",
    "unit": "g",
    "allergens": []
  },
  "fish-head": {
    "name": "清理后的胖头鱼头",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "smoked-tofu": {
    "name": "香干",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "cured-pork": {
    "name": "正规腊肉",
    "unit": "g",
    "allergens": []
  },
  "cured-fish": {
    "name": "正规腊鱼",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "round-cabbage": {
    "name": "包菜",
    "unit": "g",
    "allergens": []
  },
  "cauliflower": {
    "name": "菜花",
    "unit": "g",
    "allergens": []
  },
  "crayfish": {
    "name": "正规鲜活小龙虾",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "beer": {
    "name": "啤酒",
    "unit": "g",
    "allergens": [
      "gluten"
    ]
  },
  "waipo": {
    "name": "外婆菜（核对配料）",
    "unit": "g",
    "allergens": []
  },
  "fermented-fish": {
    "name": "正规冷藏预腌臭鳜鱼",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "hairy-tofu": {
    "name": "正规冷藏毛豆腐",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "pigeon": {
    "name": "商家宰杀清理乳鸽",
    "unit": "g",
    "allergens": []
  },
  "quail-eggs": {
    "name": "熟去壳鹌鹑蛋",
    "unit": "g",
    "allergens": [
      "egg"
    ]
  },
  "squid": {
    "name": "清理后的鱿鱼",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  },
  "potato-starch": {
    "name": "土豆淀粉",
    "unit": "g",
    "allergens": []
  },
  "stone-ear": {
    "name": "干石耳",
    "unit": "g",
    "allergens": []
  },
  "dried-tofu": {
    "name": "豆腐干",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "minced-beef": {
    "name": "牛肉末",
    "unit": "g",
    "allergens": []
  },
  "grass-carp": {
    "name": "去鳞去内脏草鱼块",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "peeled-shrimp": {
    "name": "鲜虾仁",
    "unit": "g",
    "allergens": [
      "shellfish"
    ]
  }
};
const STEPS = {
  "prep": "称量所列食材，蔬菜洗净切配；生肉、鱼和即食食材使用不同刀板。",
  "aroma": "中火热油，加入葱段和姜片炒香，避免焦黑。",
  "sauce": "将配方中的酱油、醋和糖拌成调味汁，按所列用量使用。",
  "slurry": "淀粉用配方内的少量冷水调匀；沿锅边淋入，边搅边煮至略稠。",
  "seacucumber": "选已充分泡发、可烹饪的海参，按包装要求处理；葱切长段。",
  "seacucumber-braise": "葱段用油煎至金黄，加入海参、生抽、老抽、糖和水，小火烧约 10 分钟至热透入味。",
  "fish-coat": "鱼肉擦干，厚处划浅刀，裹匀淀粉；注意检查小鱼刺。",
  "fish-fry": "锅中放油分批煎炸鱼块，翻面使两侧金黄；中心达到 63°C、鱼肉易分片后沥油。",
  "sweet-sour": "锅中煮开番茄酱、米醋、糖和水，淋入淀粉水收浓，再拌入熟肉或鱼块。",
  "intestine": "购买正规熟制大肠，按标签储存，切段；不要直接套用本方处理生肠。",
  "intestine-braise": "炒香葱姜，加入熟大肠、酱油、糖、醋、桂皮和水，小火烧 20 分钟；收汁时加入花椒调香。",
  "wood-ear": "干木耳用冷水短时泡发至展开，洗净去蒂；不隔夜泡发，泡好及时烹饪。",
  "pork-marinate": "瘦猪肉切丝或薄片，用生抽和淀粉抓匀，静置约 10 分钟。",
  "mushu": "先把蛋液炒至凝固盛出，再炒熟肉片；加入木耳、黄瓜和熟蛋翻炒约 3 分钟，加盐调味。",
  "lamb": "羊肉逆纹切薄片，拌生抽和淀粉；葱斜切段，葱白与葱绿分开。",
  "lamb-fry": "中大火热油炒散羊肉，加入葱白炒至肉片熟透，再加葱绿和米醋，翻匀立即出锅。",
  "meatball": "肉末拌鸡蛋、淀粉、盐和姜末，沿同一方向搅至发黏，分成 4 个丸子。",
  "meatball-braise": "丸子用油煎至表面定型，加入生抽、糖和水，小火煮 25–30 分钟，肉馅中心至少 71°C。",
  "greens-end": "加入白菜继续煮约 5 分钟至菜梗熟透，盛出时按口味少量调盐。",
  "fish-filling": "鲅鱼肉仔细去刺剁细，分次搅入配方内的冷水，再拌韭菜、姜末、盐和油。",
  "dumplings": "饺子皮逐张放馅，边缘蘸水捏紧；不要包得过满。",
  "dumpling-boil": "水沸下饺子，轻推防粘；再沸后保持微沸约 6–8 分钟，切开一个确认鱼馅完全熟透，中心至少 63°C。",
  "pucai": "蒲菜去老皮切段，焯水约 1 分钟后沥干；牛奶最后加入。",
  "milk-soup": "葱姜炒香后加水煮开，放蒲菜煮约 5 分钟，再加牛奶和盐，小火加热至热透，不久煮。",
  "chicken-cut": "鸡腿切适口块，擦干水分，不冲洗生鸡肉；接触生肉后清洗手和器具。",
  "chicken-braise": "鸡块煎至表面变色，加香菇、生抽和水，盖锅小火焖 25–30 分钟，鸡肉中心至少 74°C。",
  "reduce": "揭盖转中火，轻推收汁至酱汁能挂在食材表面，避免烧干。",
  "kidney": "猪腰剖开，彻底剔除白色筋膜和腰臊，切交叉浅花刀后切块；姜、青椒切片。",
  "kidney-cook": "腰花入沸水焯至卷起，沥干；另锅炒姜、青椒，再加腰花和生抽炒熟，腰花中心至少 71°C。",
  "belly": "五花肉切厚片或方块，冷水入锅焯至表面变色，捞出沥水。",
  "belly-braise": "锅中放肉、葱姜、生抽、老抽、糖、八角和水，煮开后小火焖 60–90 分钟至肉软烂。",
  "shrimp-soak": "干海米用清水快速冲洗，再泡约 10 分钟，泡水不用来补盐。",
  "cabbage-shrimp": "炒香姜丝和海米，放白菜梗略炒，加水焖约 5 分钟；再放菜叶煮软，加盐调味。",
  "dice-chicken": "鸡胸肉切丁，拌生抽和淀粉，腌约 10 分钟；花生使用已熟制的。",
  "spicy-aroma": "中小火热油，炒香干辣椒、花椒、姜和蒜；辣椒不要炒黑。",
  "kungpao": "加入鸡丁炒熟，淋入预调酱油醋糖汁炒匀；鸡肉中心至少 74°C，最后放熟花生和葱段。",
  "tofu": "豆腐切方块，在微沸水中煮 2 分钟后沥干，减少翻炒时碎裂。",
  "mapo": "炒熟牛肉末，放豆瓣酱、蒜末炒香，加水和豆腐，小火煮 5 分钟至热透，撒花椒。",
  "yuxiang": "炒熟肉丝盛出；炒豆瓣酱和姜蒜，加入木耳、胡萝卜、青椒炒至熟，再倒回肉丝和糖醋汁。",
  "twice-pork": "五花肉加姜放水中煮约 25–35 分钟至中心至少 63°C，静置 3 分钟后稍凉切薄片。",
  "twice-fry": "肉片入锅煸出少量油，炒入豆瓣酱、豆豉、生抽和青椒，炒至青椒熟软。",
  "beef": "牛肉逆纹切薄片，拌生抽、淀粉和少量配方内的水，腌约 10 分钟。",
  "water-beef": "豆芽和白菜先煮熟铺碗底；炒香豆瓣酱、姜蒜，加水煮开，再滑入牛肉煮至全熟。",
  "chili-finish": "撒干辣椒和花椒，淋少量烧热的配方内食用油激香；按耐辣程度减少辣椒，不额外加油。",
  "chili-chicken": "鸡块先用中火煎至各面金黄，加少量水盖锅焖熟，中心至少 74°C；揭盖收干，再与辣椒香料炒匀。",
  "poach-pork": "整块瘦肉加姜和水微沸煮约 25–35 分钟，中心至少 63°C，离火静置 3 分钟后切薄片。",
  "garlic-dressing": "蒜捣泥，拌生抽、米醋、糖和辣椒油；肉片配黄瓜装盘，淋上酱汁。",
  "pickled-fish": "酸菜切段冲洗后沥干；鱼片检查残刺，用淀粉轻拌。",
  "pickled-soup": "姜蒜炒香，加入酸菜炒 2 分钟，加水煮 10 分钟；鱼片分散下锅，煮至中心 63°C 且易分片。",
  "beans": "四季豆去筋切段，沸水煮约 10–15 分钟至完全熟透，再沥干；不能只看颜色判断。",
  "beans-fry": "先将肉末炒至全熟，再加干辣椒、蒜和熟四季豆，中火炒干表面水分，用生抽调味。",
  "vermicelli": "干粉丝按包装用温水泡软剪短，沥干；不要长时间常温浸泡。",
  "ants": "炒熟肉末，加入豆瓣酱、蒜和生抽炒香；加水与粉丝，小火煮约 3–5 分钟至熟软吸汁。",
  "poach-chicken": "鸡腿加姜葱和水微沸煮约 25–35 分钟，最厚处中心至少 74°C；关火焖 5 分钟。",
  "chicken-sauce": "熟鸡肉稍凉斩块；用生抽、米醋、辣椒油、蒜末调汁，淋在鸡肉上，撒熟芝麻和熟花生。",
  "beef-dry": "牛肉切细丝，中火用油煸炒至全熟并收干水分；加姜丝、干辣椒和芹菜继续炒 2–3 分钟，以生抽调味。",
  "ginger-dip": "姜和葱切细，加入配方内食用油与盐，拌成姜葱蘸料；熟鸡切块后蘸食。",
  "ribs-marinate": "排骨切小块沥干，拌豆豉、蒜末、生抽、淀粉和油，腌 15 分钟。",
  "ribs-steam": "排骨平铺浅盘，水沸后入蒸锅，蒸 25–35 分钟至软熟；最厚肉处至少 63°C，再静置 3 分钟。",
  "charsiu-marinate": "猪梅花肉切成约 3 厘米厚长条，拌蜂蜜、生抽、蚝油和糖，盖好冷藏腌至少 2 小时。",
  "charsiu-roast": "烤箱预热 200°C，肉放烤架并垫接汁盘，烤约 25–35 分钟，中途翻面；中心至少 63°C 后静置 3 分钟。",
  "discard-marinade": "接触生肉的腌汁直接弃去，不作蘸汁；熟肉用干净刀板切片。",
  "fish-steam": "鱼擦干铺姜丝和葱，水沸后大火蒸约 10–15 分钟；按厚度延长，鱼最厚处至少 63°C。",
  "fish-finish": "小心倒去部分蒸汁，淋生抽和配方内食用油；食用时注意鱼刺。",
  "shrimp-clean": "鲜虾剪须去虾线，沥干；接触生虾后清洁刀板和双手。",
  "shrimp-poach": "水加姜葱煮开，放虾煮约 3–5 分钟；确认最厚处至少 63°C、肉质不透明，再捞出。",
  "scallop-arrange": "扇贝只用已清理的可食部，铺在泡软的粉丝上，拌入蒜末、生抽和油。",
  "scallop-steam": "水沸上锅蒸约 8–10 分钟，按厚度调整，贝肉中心至少 63°C 且完全不透明。",
  "celery-lily": "芹菜切片，鲜百合拆瓣洗净；分别沸水焯约 1 分钟后沥干。",
  "celery-fry": "蒜末炒香，加入芹菜与百合翻炒约 2–3 分钟至熟，以盐调味。",
  "pork-coat": "瘦肉切小块，拌生抽和鸡蛋，裹匀淀粉；菠萝和青椒切块。",
  "pork-fry": "中火分批将肉块煎炸至金黄熟透，中心至少 63°C，静置 3 分钟后沥油。",
  "pineapple-finish": "将菠萝、青椒和糖醋番茄汁煮约 2 分钟，再拌入熟肉块，趁热上桌。",
  "beef-noodles": "先炒熟牛肉盛出；豆芽、葱段炒熟后加入鲜河粉和生抽，用宽铲轻翻至河粉全部热透，再拌回牛肉。",
  "rice-soak": "生米洗净泡约 30 分钟后沥干；按米与锅具说明准备所列水量。",
  "clay-rice": "厚底锅刷油，米和水煮开后转小火，米面出现孔洞时铺薄切腊肠，加盖小火煮约 15 分钟。",
  "rice-finish": "确认米芯熟透、腊肠全熟；如仍夹生，少量加水继续煮。关火焖 10 分钟，配煮熟青菜和少量生抽。",
  "chicken-soup": "鸡块、姜、香菇和水煮开，撇沫后小火炖约 60 分钟，鸡肉最厚处至少 74°C，末尾加盐。",
  "baby-cabbage": "娃娃菜纵切，蒜用油炒香，加水和切块皮蛋煮开；下娃娃菜煮约 5–8 分钟至熟软。",
  "salt-finish": "尝味后按需加入配方内的盐，煮匀后出锅。",
  "lion-soup": "肉末拌姜末、淀粉和盐，搅至发黏，做成 4 个丸子；放入微沸水中，小火煮约 30 分钟至中心 71°C。",
  "squirrel": "鳜鱼肉去残刺，鱼肉面切交叉浅花刀而不断皮，裹淀粉后轻抖去浮粉。",
  "eel": "选商家已宰杀去骨的鲜鳝鱼，切段；沸水焯约 1 分钟后沥干，不处理来源不明的野生鳝鱼。",
  "eel-cook": "姜蒜用油炒香，加入鳝鱼、生抽、米醋和水，煮约 5–8 分钟至中心至少 63°C，再撒葱。",
  "tofu-strips": "豆腐干丝用沸水浇烫两次，沥干；熟火腿、姜切细丝。",
  "tofu-strip-soup": "水煮开，加入干丝、熟火腿、虾仁和姜丝，小火煮约 5–8 分钟，虾仁至少 63°C，最后调盐。",
  "fried-rice-prep": "胡萝卜切丁，豌豆焯熟，虾去壳去虾线；使用新煮米饭或及时冷藏且保存得当的熟饭。",
  "yangzhou": "蛋液炒至凝固，虾仁炒至中心 63°C，再加米饭、熟火腿、胡萝卜和熟豌豆，翻炒至全部冒热气，盐调味。",
  "duck-salt": "鸭肉用盐、花椒和姜抹匀，盖好冷藏腌约 2 小时；不放室温久腌。",
  "duck-poach": "鸭块、姜葱和水煮开后转微沸，煮约 40–50 分钟至最厚处至少 74°C，关火焖 10 分钟。",
  "ribs-braise": "排骨冷水焯后沥干，和姜、八角、生抽、老抽、糖、水煮开，小火炖 45–60 分钟至熟软。",
  "tea": "茶叶用配方内少量热水泡约 2 分钟，滤出茶汤，保留少量干净嫩叶。",
  "tea-shrimp": "虾仁去虾线擦干，拌淀粉；中火热油炒熟虾仁，中心至少 63°C，淋茶汤、加盐，轻翻后撒嫩茶叶。",
  "wensi": "嫩豆腐先切薄片再切极细丝，用冷水轻轻漂散；刀工不熟可改细条，不勉强追求细度。",
  "wensi-soup": "水与切细的熟火腿煮开，轻推入豆腐丝，微沸煮 2–3 分钟至热透，加盐调味。",
  "crab-tofu": "姜末用油炒香，放熟蟹肉略炒，加水与嫩豆腐小火煮约 5 分钟，轻推避免豆腐碎裂。",
  "smoked-fish": "生抽、老抽、糖、八角、姜与水煮开后小火煮 5 分钟，制成酱汁；鱼块另按步骤煎熟。",
  "fish-soak": "熟鱼块趁热放入已煮开的酱汁中，翻面浸约 5 分钟后盛出；这是家庭酱浸版，不做烟熏。",
  "pastry-dough": "面粉留三分之一与猪油拌成油酥；其余面粉用温水揉成面团，盖好醒 20 分钟。",
  "pastry-shape": "面团分成小份包油酥，擀长卷起再压扁；包熟火腿丁和葱花，收口朝下压成饼，表面蘸熟芝麻。",
  "pastry-bake": "烤箱预热 190°C，烤约 20–25 分钟至两面金黄、饼心无湿生面；按厚度延长。",
  "lychee": "瘦肉切厚片，在一面划交叉浅刀再切小块，拌生抽和淀粉；土豆切小块。",
  "potato-boil": "土豆块先煮约 8–12 分钟至无硬芯，沥干后与熟肉块拌入糖醋汁。",
  "fish-paste": "去刺鱼肉剁细，分次加入配方内的冰水与盐，朝同一方向搅至黏稠，再拌入红薯淀粉。",
  "fishball-fill": "猪肉末拌姜末和生抽为馅；湿手取鱼茸压扁，包少量肉馅后封成小丸子。",
  "fishball-poach": "丸子放入温水后逐渐加热至微沸，煮约 12–15 分钟；切开一颗检查鱼茸和肉馅全熟，中心至少 71°C。",
  "oyster-mix": "海蛎去残壳洗净沥干；红薯淀粉加水、盐和切细韭菜调成可流动糊。",
  "oyster-fry": "平底锅热油，倒入淀粉糊和海蛎，中火煎至定型；淋蛋液翻面，煎至蛋液凝固且海蛎中心至少 63°C。",
  "red-chicken": "鸡块拌红糟、生抽和姜，盖好冷藏腌 30 分钟；所用红糟须为正规食用产品。",
  "red-braise": "鸡块用油略煎，加水与腌料煮开，小火焖约 30 分钟至鸡肉中心至少 74°C，再收汁。",
  "drunken-ribs": "排骨用水煮约 25–35 分钟至熟，中心至少 63°C，静置 3 分钟；沥干后用油略煎上色。",
  "ribs-dressing": "蒜末、生抽、米醋和糖煮开成汁，加入熟排骨，翻拌约 2 分钟至均匀挂汁。",
  "conch": "只使用商家已清理的可食螺肉，切薄片；沸水煮约 8–10 分钟至全熟，中心至少 63°C。",
  "conch-red": "姜蒜用油炒香，放红糟、生抽和少量水煮开；加入熟螺片翻炒约 2 分钟至全部热透。",
  "clam-soup": "鸡块和姜加水小火炖约 40 分钟至鸡肉中心至少 74°C；此汤作为家常汤底，不使用生鸡汁。",
  "clams": "海蚌洗净，破壳或敲击不闭合的弃去；放入滚汤，开壳后再煮约 3–5 分钟，未开的弃去。",
  "sticky-soak": "糯米、莲子分别按包装要求提前浸泡至吸水，沥干；香菇和板栗切小块。",
  "sticky-finish": "检查米饭无硬芯、莲子板栗熟软；如夹生，少量加水继续蒸，焖 5 分钟后食用。",
  "ginger-duck": "鸭块焯水沥干；姜切厚片，用油中小火煸至边缘金黄，再放鸭肉炒干表面水分。",
  "duck-braise": "加入生抽、糖和水，煮开后盖锅小火炖 45–60 分钟，鸭肉中心至少 74°C，软烂后收汁。",
  "min-rice": "海米、香菇、五花肉丁用油炒香，肉炒熟后加生抽、白菜和生米翻匀；加入水煮开，小火盖煮约 20 分钟。",
  "rice-check": "米芯完全熟透后关火焖 10 分钟；若偏干夹生，少量加水继续加热，不只依计时判断。",
  "shacha": "蒜用油炒香，牛肉片炒至全熟，加入沙茶酱、少量水和芹菜，翻炒约 2 分钟至菜熟汁匀。",
  "taro": "芋头去皮切块后蒸约 20–30 分钟至可轻压碎；处理生芋头时戴手套，必须熟透。",
  "taro-paste": "熟芋头压泥，拌糖和猪油，小火搅拌至细腻；按需要加配方内的水调节浓稠度。",
  "taiji": "芋泥与即食红豆沙分区摆成阴阳形，表面放熟莲子，蒸约 5 分钟至全部热透；甜点少量分食。",
  "vinegar-fish": "鱼块加姜与水微沸煮约 8–12 分钟至最厚处至少 63°C，盛盘；保留少量已煮熟鱼汤。",
  "vinegar-glaze": "用少量熟鱼汤煮开生抽、米醋和糖，淋淀粉水煮成薄芡，浇在熟鱼上，注意鱼刺。",
  "dongpo": "焯好的五花肉皮朝下铺在葱姜上，加生抽、老抽、糖、料酒和水；小火焖 90–120 分钟，翻面继续煮至软糯。",
  "tofu-roll": "干豆腐皮按包装泡软，裁成小方片；肉末拌姜末、生抽为馅，薄薄铺开卷紧，封口蘸淀粉水。",
  "roll-fry": "豆腐卷中小火分批煎炸，勤翻面至酥脆；切开检查肉馅全熟、中心至少 71°C，再沥油。",
  "fish-soup": "鱼肉加姜与水煮至中心至少 63°C，仔细剔除残刺后拆碎，保留熟鱼汤。",
  "sister-soup": "熟鱼汤加入香菇丝、熟火腿丝和鱼肉煮开，调生抽、米醋，淋蛋液煮至完全凝固。",
  "bamboo": "鲜笋剥壳去老根切块，足量清水煮至少 20 分钟至熟，倒掉煮笋水；不用生笋直接短炒。",
  "bamboo-braise": "熟笋用油煸炒，加入生抽、老抽、糖和水，小火焖 10–15 分钟后揭盖收汁。",
  "yellow-fish": "黄鱼擦干用油煎两面，加入姜、雪菜和水煮开，小火煮约 10 分钟，鱼最厚处至少 63°C。",
  "sesame-fill": "熟黑芝麻粉与糖、猪油拌匀，冷藏至可成团，分成小份作馅。",
  "tangyuan": "糯米粉逐次加温水揉成不裂面团，分小份包芝麻馅，搓圆封严，大小尽量均匀。",
  "tangyuan-boil": "沸水下汤圆，轻推防粘；浮起后再微沸约 3–5 分钟，检查中心无生粉团，稍凉后小口食用。",
  "drunken-chicken": "熟鸡用干净器具切块，放浅容器尽快冷却并冷藏；倒入按标签可直接使用的熟制糟卤，冷藏浸约 2 小时。",
  "dried-greens": "梅干菜冲洗，按包装短时泡发至软，挤干切碎；不长时间常温浸泡。",
  "meicai-pork": "焯熟的五花肉切厚片，皮朝下排碗中，覆盖梅干菜，淋生抽、老抽、糖和水，蒸约 75–90 分钟至软烂。",
  "invert": "戴隔热手套取出，用深盘扣住碗口小心翻扣；也可直接在碗中食用，避免烫伤。",
  "dried-bamboo": "熟笋与泡软梅干菜用油翻炒，加生抽和水，小火焖约 15 分钟至入味。",
  "soy-duck": "鸭块用生抽、老抽、糖、八角和姜冷藏腌 1 小时，再加水煮开，小火炖约 50 分钟至鸭肉中心至少 74°C。",
  "fish-head": "鱼头请商家清理对半剖开，去鳃、洗净残血后擦干；放深盘铺姜葱，表面盖剁椒。",
  "head-steam": "水沸后蒸约 20–25 分钟，按鱼头大小延长，最厚处至少 63°C；最后淋配方内的油与生抽，注意碎骨。",
  "hunan-beef": "姜蒜用油炒香，牛肉薄片炒至全熟，加入鲜辣椒、芹菜和生抽，再炒 2–3 分钟至菜熟。",
  "pepper-pork": "青椒先在无油锅中中火煸至起皱盛出；肉片用油炒熟，加蒜、生抽与青椒翻炒约 2 分钟。",
  "smoked-tofu": "香干切片，肉丝先用油炒至全熟；加入蒜、鲜辣椒和香干，淋生抽，炒约 3 分钟至全部热透。",
  "cured": "腊肉和腊鱼按包装要求浸洗、切薄片；若产品标签另有更长加热要求，优先照标签执行。",
  "cured-steam": "腊肉和腊鱼铺盘加姜丝，沸水蒸约 25–30 分钟至全熟；不再额外加盐，蒸汁可少量弃去。",
  "cabbage": "包菜手撕小片洗净沥干，粗梗切薄；干辣椒剪段。",
  "cabbage-fry": "热油炒香蒜和干辣椒，先炒粗梗再加菜叶，中大火炒至熟，沿锅边淋生抽和米醋。",
  "cauliflower": "菜花切小朵洗净，沸水焯约 2 分钟沥干；五花肉切薄片。",
  "cauliflower-fry": "五花肉炒至熟并煸出少量油，加蒜、干辣椒和菜花炒约 3–5 分钟至花梗全熟，生抽调味。",
  "crayfish": "选正规鲜活小龙虾，刷洗腹部、去不食用部位；不使用死虾，不用酒或辣椒代替充分加热。",
  "crayfish-cook": "炒香姜蒜、豆瓣酱和干辣椒，加入小龙虾、生抽与水煮开，盖锅保持沸腾约 15–20 分钟至全熟，虾肉至少 63°C。",
  "beer-duck": "鸭块炒干水分后放姜蒜、生抽、啤酒和水，煮开后不盖锅煮 5 分钟，再盖锅小火炖约 45 分钟至中心 74°C。",
  "waipo": "外婆菜先尝咸度，必要时冲洗沥干；肉末炒至全熟，放蒜、辣椒、外婆菜炒约 3 分钟，通常无需加盐。",
  "pepper-roast": "青椒洗净擦干，在平底锅中火煎烙至表皮起泡且内部熟软；取出切小块。",
  "pound-egg": "正规即食皮蛋去壳切块，与熟青椒、蒜泥、生抽、米醋放碗中捣拌，现做现吃。",
  "fermented-fish": "使用正规冷藏预腌臭鳜鱼，核对保质期与加热要求；擦干切块，不在家自行发酵生鱼。",
  "hui-fish": "鱼块用油煎定型，加姜、蒜、生抽和水，小火煮约 15–20 分钟至中心至少 63°C；按标签要求延长加热。",
  "hairy-tofu": "仅使用正规冷藏毛豆腐，遵循包装储存要求；异常包装或超过保质期不用，不套用本方自制发酵。",
  "hairy-fry": "毛豆腐用中小火煎至两面金黄起皱，加入蒜、生抽和少量水，加盖煮约 5–8 分钟至全熟，再收汁。",
  "pigeon": "商家清理的乳鸽切块，加姜、香菇和水煮开，撇沫后小火炖约 60 分钟，最厚处至少 74°C。",
  "onepot-cook": "煮开后盖锅小火炖约 40 分钟，鸡肉中心至少 74°C，所有食材热透；中途留意水量避免干锅。",
  "ham-bamboo": "熟笋、熟火腿和香菇切片，加姜、水小火炖约 15–20 分钟至入味；火腿含盐，先尝后调味。",
  "chop-suey": "鸡肉先加姜、水煮约 20 分钟，再放鱿鱼、熟火腿、香菇和白菜煮约 8 分钟；鸡肉至少 74°C、鱿鱼至少 63°C。",
  "hui-chicken": "鸡块拌生抽、姜和香菇，盖好冷藏腌 15 分钟，铺浅盘；水沸后蒸约 30–40 分钟至鸡肉中心至少 74°C。",
  "hui-balls": "猪肉末拌豆腐碎、姜末、盐和土豆淀粉，搅至黏稠，搓成小丸子。",
  "balls-steam": "丸子平铺蒸盘，水沸后蒸约 20–25 分钟，中心至少 71°C；切开一颗检查内部全熟。",
  "jixi": "五花肉细丝先炒熟，加蒜、香菇、白菜炒软，再放泡软粉丝、生抽和水，小火煮 3–5 分钟至粉丝熟软。",
  "daoban": "腊肉按标签处理后整块加姜、水煮约 40–60 分钟至熟软；切薄片前换用干净刀板。",
  "stone-ear": "干石耳按包装短时泡发，反复冲洗去砂，沥干；泡好后及时烹饪，不隔夜常温泡发。",
  "stone-chicken": "鸡块、石耳、姜和水煮开，撇沫后小火炖约 45 分钟，鸡肉中心至少 74°C，最后加盐。",
  "taguo-dough": "面粉逐次加入温水揉成柔软面团，盖好醒 20 分钟；韭菜、豆腐干切碎，拌盐和一半食用油。",
  "taguo-shape": "面团分小份擀圆，包入韭菜豆腐干馅收紧口，再轻压成薄饼，避免压破。",
  "taguo-fry": "平底锅刷剩余油，中小火两面各烙约 4–6 分钟，至饼皮金黄、中心无生面，韭菜馅熟透。",
  "serve": "确认食材全熟后盛盘，趁热食用；剩余菜尽快分入浅容器冷藏，再食用时充分加热。",
  "lotus-boil": "泡好的莲子加清水煮约 30–45 分钟至软熟，沥干备用。",
  "duck-slice": "熟鸭稍凉后用干净刀板切块；需冷食时及时分装冷藏，不长时间常温晾放。",
  "minced-beef-done": "牛肉末翻炒至完全散开熟透，中心至少 71°C，不用半生肉末配豆腐。",
  "salted-veg": "雪菜先冲洗沥干，切碎；不另加盐，以实际产品咸度调整用量。",
  "pineapple-prep": "菠萝与青椒切块，先用锅中少量油炒约 2 分钟；另放一旁，待肉块熟透后与糖醋汁一起回锅。",
  "lotus-soak": "莲子按包装要求用清水提前浸泡至吸水，沥干；长时间浸泡需冷藏。",
  "crab-rice-complete": "泡好的糯米与香菇、板栗、莲子、海米、熟火腿、熟笋、胡萝卜、豌豆拌生抽和水，放浅碗蒸 30 分钟；铺青蟹再蒸 15–20 分钟至蟹肉 63°C。",
  "onepot-blanched": "锅底铺白菜，再依次铺豆腐、焯过的五花肉片、鸡块、香菇和熟鹌鹑蛋，加入生抽、姜和水至约八分满。"
};
const TIPS = {
  "balanced": "家庭简化版，保留主要风味；搭配主食和足量蔬菜，按人数分食。",
  "rich": "这类煎炸或肥肉菜可少量分享，配清淡蔬菜；所列用油为烹饪用量，不代表全部吃入。",
  "salty": "腌制、发酵或酱料食材自带盐分，先尝味再调盐；搭配无额外盐的蔬菜。",
  "sweet": "甜点或甜口菜少量分食，不把它替代正餐；糖量可按口味减少。",
  "alcohol": "含酒调味不保证酒精全部挥发；需要无酒精饮食时，请选择其他不含酒的菜谱。",
  "bones": "鱼、蟹等食材仍需留意残刺和硬壳；先按实际可食部分分份，再配主食蔬菜。"
};
const DISHES = [
  {"id": "lu-sea-cucumber", "cuisine": "lu", "name": "葱烧海参", "category": "meat", "minutes": 30,
    amounts: {"sea-cucumber": 250, "scallion": 80, "ginger": 8, "soy": 8, "dark-soy": 3, "sugar": 4, "oil": 12, "starch": 5, "water": 150},
    steps: ["prep", "seacucumber", "seacucumber-braise", "slurry"], tip: "salty",
    aliases: ["cong shao hai shen", "Scallion-braised sea cucumber"] },
  {"id": "lu-carp", "cuisine": "lu", "name": "糖醋鲤鱼", "category": "meat", "minutes": 40,
    amounts: {"carp": 400, "ginger": 8, "starch": 35, "ketchup": 25, "vinegar": 20, "sugar": 15, "oil": 80, "water": 100},
    steps: ["prep", "fish-coat", "fish-fry", "sweet-sour"], tip: "rich",
    aliases: ["糖醋鱼", "sweet sour carp", "Sweet-and-sour carp"] },
  {"id": "lu-intestine", "cuisine": "lu", "name": "九转大肠", "category": "meat", "minutes": 40,
    amounts: {"intestine": 300, "scallion": 20, "ginger": 10, "soy": 8, "sugar": 12, "vinegar": 15, "cinnamon": 1, "peppercorn": 1, "oil": 8, "water": 180},
    steps: ["prep", "intestine", "intestine-braise", "reduce"], tip: "rich",
    aliases: ["Jinan sweet-sour braised intestine"] },
  {"id": "lu-mushu", "cuisine": "lu", "name": "木须肉", "category": "meat", "minutes": 30,
    amounts: {"pork": 180, "egg": 2, "wood-ear": 8, "cucumber": 150, "soy": 5, "starch": 5, "salt": 0.5, "oil": 10},
    steps: ["prep", "wood-ear", "pork-marinate", "mushu"], tip: "balanced",
    aliases: ["Mushu pork with egg and wood ear"] },
  {"id": "lu-lamb", "cuisine": "lu", "name": "葱爆羊肉", "category": "meat", "minutes": 25,
    amounts: {"lamb": 250, "scallion": 100, "soy": 8, "starch": 5, "vinegar": 5, "oil": 10},
    steps: ["prep", "lamb", "lamb-fry", "serve"], tip: "balanced",
    aliases: ["Scallion stir-fried lamb"] },
  {"id": "lu-meatballs", "cuisine": "lu", "name": "四喜丸子", "category": "meat", "minutes": 55,
    amounts: {"minced-pork": 300, "egg": 1, "starch": 15, "ginger": 8, "salt": 0.5, "soy": 8, "sugar": 4, "cabbage": 200, "oil": 15, "water": 400},
    steps: ["prep", "meatball", "meatball-braise", "greens-end"], tip: "rich",
    aliases: ["Four braised pork meatballs"] },
  {"id": "lu-dumplings", "cuisine": "lu", "name": "鲅鱼饺子", "category": "staple", "minutes": 55,
    amounts: {"mackerel": 250, "chives": 80, "wrappers": 240, "ginger": 5, "salt": 1, "oil": 8, "water": 80},
    steps: ["prep", "fish-filling", "dumplings", "dumpling-boil"], tip: "bones",
    aliases: ["Spanish mackerel dumplings"] },
  {"id": "lu-cattail", "cuisine": "lu", "name": "奶汤蒲菜", "category": "plant", "minutes": 25,
    amounts: {"pucai": 300, "milk": 150, "ginger": 5, "scallion": 10, "salt": 1, "oil": 6, "water": 300},
    steps: ["prep", "pucai", "milk-soup", "serve"], tip: "balanced",
    aliases: ["Cattail shoots in milky broth"] },
  {"id": "lu-chicken", "cuisine": "lu", "name": "黄焖鸡", "category": "meat", "minutes": 50,
    amounts: {"chicken-leg": 400, "mushroom": 120, "scallion": 15, "ginger": 10, "soy": 10, "oil": 10, "water": 300},
    steps: ["chicken-cut", "aroma", "chicken-braise", "reduce"], tip: "balanced",
    aliases: ["Shandong braised chicken"] },
  {"id": "lu-kidney", "cuisine": "lu", "name": "爆炒腰花", "category": "meat", "minutes": 35,
    amounts: {"kidney": 250, "pepper": 150, "ginger": 10, "soy": 8, "oil": 10, "starch": 5, "water": 50},
    steps: ["prep", "kidney", "kidney-cook", "slurry"], tip: "balanced",
    aliases: ["Stir-fried pork kidney"] },
  {"id": "lu-pork-braise", "cuisine": "lu", "name": "济南把子肉", "category": "meat", "minutes": 110,
    amounts: {"belly": 350, "scallion": 20, "ginger": 15, "soy": 15, "dark-soy": 5, "sugar": 8, "star-anise": 1, "water": 650},
    steps: ["prep", "belly", "belly-braise", "reduce"], tip: "rich",
    aliases: ["Jinan soy-braised pork belly"] },
  {"id": "lu-cabbage", "cuisine": "lu", "name": "海米扒白菜", "category": "meat", "minutes": 25,
    amounts: {"cabbage": 400, "dried-shrimp": 15, "ginger": 5, "oil": 6, "salt": 0.5, "water": 180},
    steps: ["prep", "shrimp-soak", "cabbage-shrimp", "serve"], tip: "salty",
    aliases: ["Napa cabbage with dried shrimp"] },
  {"id": "chuan-kungpao", "cuisine": "chuan", "name": "宫保鸡丁", "category": "meat", "minutes": 30,
    amounts: {"chicken": 250, "peanuts": 35, "scallion": 20, "ginger": 8, "garlic": 2, "dried-chili": 5, "peppercorn": 1, "soy": 10, "vinegar": 10, "sugar": 6, "starch": 8, "oil": 12},
    steps: ["prep", "dice-chicken", "sauce", "spicy-aroma", "kungpao"], tip: "balanced",
    aliases: ["宫爆鸡丁", "kung pao", "Kung pao chicken"] },
  {"id": "chuan-mapo", "cuisine": "chuan", "name": "麻婆豆腐", "category": "meat", "minutes": 25,
    amounts: {"soft-tofu": 350, "minced-beef": 100, "bean-paste": 12, "garlic": 2, "peppercorn": 1, "starch": 6, "oil": 10, "water": 200},
    steps: ["prep", "tofu", "minced-beef-done", "mapo", "slurry"], tip: "salty",
    aliases: ["Mapo tofu"] },
  {"id": "chuan-yuxiang", "cuisine": "chuan", "name": "鱼香肉丝", "category": "meat", "minutes": 35,
    amounts: {"pork": 200, "wood-ear": 5, "carrot": 80, "pepper": 100, "ginger": 5, "garlic": 2, "bean-paste": 10, "soy": 8, "vinegar": 12, "sugar": 8, "starch": 8, "oil": 12, "water": 50},
    steps: ["prep", "wood-ear", "pork-marinate", "sauce", "yuxiang", "slurry"], tip: "balanced",
    aliases: ["Yuxiang shredded pork"] },
  {"id": "chuan-twice-pork", "cuisine": "chuan", "name": "回锅肉", "category": "meat", "minutes": 50,
    amounts: {"belly": 250, "pepper": 200, "ginger": 10, "bean-paste": 10, "black-bean": 5, "soy": 5, "water": 800},
    steps: ["prep", "twice-pork", "twice-fry", "serve"], tip: "rich",
    aliases: ["Twice-cooked pork"] },
  {"id": "chuan-water-beef", "cuisine": "chuan", "name": "水煮牛肉", "category": "meat", "minutes": 35,
    amounts: {"beef": 250, "sprouts": 150, "cabbage": 150, "bean-paste": 12, "ginger": 8, "garlic": 3, "dried-chili": 5, "peppercorn": 1, "soy": 8, "starch": 8, "oil": 12, "water": 600},
    steps: ["prep", "beef", "water-beef", "chili-finish"], tip: "salty",
    aliases: ["Sichuan beef in chili broth"] },
  {"id": "chuan-chili-chicken", "cuisine": "chuan", "name": "辣子鸡", "category": "meat", "minutes": 45,
    amounts: {"chicken-leg": 400, "ginger": 10, "garlic": 3, "dried-chili": 15, "peppercorn": 2, "soy": 8, "oil": 15, "water": 80},
    steps: ["prep", "chicken-cut", "spicy-aroma", "chili-chicken"], tip: "balanced",
    aliases: ["Chili chicken"] },
  {"id": "chuan-garlic-pork", "cuisine": "chuan", "name": "蒜泥白肉", "category": "meat", "minutes": 50,
    amounts: {"pork": 300, "ginger": 15, "cucumber": 200, "garlic": 4, "soy": 8, "vinegar": 10, "sugar": 3, "chili-oil": 5, "water": 1000},
    steps: ["prep", "poach-pork", "garlic-dressing", "serve"], tip: "balanced",
    aliases: ["Poached pork with garlic sauce"] },
  {"id": "chuan-pickled-fish", "cuisine": "chuan", "name": "酸菜鱼", "category": "meat", "minutes": 40,
    amounts: {"snakehead": 350, "pickled-greens": 150, "ginger": 10, "garlic": 3, "starch": 8, "oil": 10, "water": 700},
    steps: ["prep", "pickled-fish", "pickled-soup", "serve"], tip: "salty",
    aliases: ["Fish with pickled mustard greens"] },
  {"id": "chuan-green-beans", "cuisine": "chuan", "name": "干煸四季豆", "category": "meat", "minutes": 35,
    amounts: {"beans": 350, "minced-pork": 80, "garlic": 2, "dried-chili": 4, "soy": 8, "oil": 10},
    steps: ["prep", "beans", "beans-fry", "serve"], tip: "balanced",
    aliases: ["Dry-fried green beans"] },
  {"id": "chuan-ants", "cuisine": "chuan", "name": "蚂蚁上树", "category": "staple", "minutes": 25,
    amounts: {"vermicelli": 100, "minced-pork": 120, "bean-paste": 10, "garlic": 2, "soy": 5, "oil": 8, "water": 220},
    steps: ["prep", "vermicelli", "ants", "serve"], tip: "salty",
    aliases: ["Glass noodles with minced pork"] },
  {"id": "chuan-mouthwatering", "cuisine": "chuan", "name": "口水鸡", "category": "meat", "minutes": 50,
    amounts: {"chicken-leg": 400, "ginger": 15, "scallion": 20, "garlic": 3, "soy": 8, "vinegar": 12, "chili-oil": 8, "sesame": 5, "peanuts": 20, "water": 1000},
    steps: ["prep", "poach-chicken", "chicken-sauce", "serve"], tip: "balanced",
    aliases: ["Chicken with Sichuan chili dressing"] },
  {"id": "chuan-dry-beef", "cuisine": "chuan", "name": "干煸牛肉丝", "category": "meat", "minutes": 30,
    amounts: {"beef": 250, "celery": 150, "ginger": 10, "dried-chili": 5, "soy": 8, "oil": 12, "salt": 0.25},
    steps: ["prep", "beef-dry", "salt-finish", "serve"], tip: "balanced",
    aliases: ["Dry-fried shredded beef"] },
  {"id": "yue-white-chicken", "cuisine": "yue", "name": "白切鸡", "category": "meat", "minutes": 50,
    amounts: {"chicken-leg": 450, "ginger": 25, "scallion": 30, "oil": 8, "salt": 1, "water": 1200},
    steps: ["prep", "poach-chicken", "ginger-dip", "serve"], tip: "balanced",
    aliases: ["Cantonese poached chicken"] },
  {"id": "yue-ribs", "cuisine": "yue", "name": "豉汁蒸排骨", "category": "meat", "minutes": 55,
    amounts: {"ribs": 350, "black-bean": 10, "garlic": 3, "soy": 8, "starch": 8, "oil": 6},
    steps: ["prep", "ribs-marinate", "ribs-steam", "serve"], tip: "salty",
    aliases: ["Steamed ribs with black bean sauce"] },
  {"id": "yue-charsiu", "cuisine": "yue", "name": "蜜汁叉烧", "category": "meat", "minutes": 170,
    amounts: {"pork-neck": 350, "honey": 15, "soy": 12, "oyster": 8, "sugar": 5},
    steps: ["prep", "charsiu-marinate", "charsiu-roast", "discard-marinade"], tip: "sweet",
    aliases: ["Honey char siu"] },
  {"id": "yue-seabass", "cuisine": "yue", "name": "清蒸鲈鱼", "category": "meat", "minutes": 30,
    amounts: {"seabass": 450, "ginger": 15, "scallion": 20, "soy": 10, "oil": 6},
    steps: ["prep", "fish-steam", "fish-finish", "serve"], tip: "bones",
    aliases: ["Cantonese steamed sea bass"] },
  {"id": "yue-shrimp", "cuisine": "yue", "name": "白灼虾", "category": "meat", "minutes": 20,
    amounts: {"shrimp": 350, "ginger": 10, "scallion": 15, "soy": 5, "water": 1000},
    steps: ["prep", "shrimp-clean", "shrimp-poach", "serve"], tip: "bones",
    aliases: ["Poached fresh shrimp"] },
  {"id": "yue-scallops", "cuisine": "yue", "name": "蒜蓉粉丝蒸扇贝", "category": "meat", "minutes": 30,
    amounts: {"scallops": 250, "vermicelli": 60, "garlic": 4, "soy": 8, "oil": 8},
    steps: ["prep", "vermicelli", "scallop-arrange", "scallop-steam"], tip: "balanced",
    aliases: ["Scallops steamed with garlic and glass noodles"] },
  {"id": "yue-lily", "cuisine": "yue", "name": "西芹炒百合", "category": "plant", "minutes": 20,
    amounts: {"celery": 250, "lily": 100, "garlic": 2, "oil": 6, "salt": 1},
    steps: ["prep", "celery-lily", "celery-fry", "serve"], tip: "balanced",
    aliases: ["Celery and lily bulb stir-fry"] },
  {"id": "yue-sweet-pork", "cuisine": "yue", "name": "菠萝咕咾肉", "category": "meat", "minutes": 45,
    amounts: {"pork": 250, "pineapple": 150, "pepper": 100, "egg": 1, "soy": 5, "starch": 35, "ketchup": 25, "vinegar": 15, "sugar": 12, "oil": 70, "water": 80},
    steps: ["prep", "pork-coat", "pineapple-prep", "pork-fry", "sweet-sour", "pineapple-finish"], tip: "rich",
    aliases: ["咕噜肉", "Pineapple sweet-and-sour pork"] },
  {"id": "yue-beef-noodles", "cuisine": "yue", "name": "干炒牛河", "category": "staple", "minutes": 30,
    amounts: {"beef": 200, "rice-noodles": 350, "sprouts": 150, "scallion": 30, "soy": 12, "starch": 5, "oil": 12, "water": 20},
    steps: ["prep", "beef", "beef-noodles", "serve"], tip: "balanced",
    aliases: ["Cantonese beef chow fun"] },
  {"id": "yue-clay-rice", "cuisine": "yue", "name": "腊味煲仔饭", "category": "staple", "minutes": 75,
    amounts: {"raw-rice": 160, "sausage": 80, "greens": 250, "soy": 5, "oil": 5, "water": 240},
    steps: ["prep", "rice-soak", "clay-rice", "rice-finish"], tip: "salty",
    aliases: ["Clay-pot-style rice with sausage"] },
  {"id": "yue-soup", "cuisine": "yue", "name": "老火鸡汤", "category": "meat", "minutes": 80,
    amounts: {"chicken-leg": 400, "mushroom": 120, "ginger": 15, "salt": 1, "water": 1200},
    steps: ["prep", "chicken-cut", "chicken-soup", "serve"], tip: "balanced",
    aliases: ["Slow-simmered chicken soup"] },
  {"id": "yue-cabbage", "cuisine": "yue", "name": "上汤娃娃菜", "category": "plant", "minutes": 25,
    amounts: {"baby-cabbage": 350, "preserved-egg": 1, "garlic": 3, "oil": 6, "salt": 0.5, "water": 350},
    steps: ["prep", "baby-cabbage", "salt-finish", "serve"], tip: "balanced",
    aliases: ["Baby cabbage in savory broth"] },
  {"id": "su-lion", "cuisine": "su", "name": "清炖狮子头", "category": "meat", "minutes": 55,
    amounts: {"minced-pork": 300, "ginger": 10, "starch": 12, "salt": 1, "cabbage": 250, "water": 700},
    steps: ["prep", "lion-soup", "greens-end", "serve"], tip: "balanced",
    aliases: ["Clear-braised lion-head meatballs"] },
  {"id": "su-squirrel", "cuisine": "su", "name": "松鼠鳜鱼", "category": "meat", "minutes": 45,
    amounts: {"mandarin-fish": 400, "starch": 40, "ketchup": 25, "vinegar": 20, "sugar": 15, "oil": 100, "water": 120},
    steps: ["prep", "squirrel", "fish-fry", "sweet-sour"], tip: "rich",
    aliases: ["Squirrel-style sweet-and-sour mandarin fish"] },
  {"id": "su-eel", "cuisine": "su", "name": "软兜长鱼", "category": "meat", "minutes": 35,
    amounts: {"eel": 300, "ginger": 10, "garlic": 3, "scallion": 20, "soy": 10, "vinegar": 8, "oil": 10, "water": 120},
    steps: ["prep", "eel", "eel-cook", "serve"], tip: "bones",
    aliases: ["Huaiyang tender rice eel"] },
  {"id": "su-tofu-strips", "cuisine": "su", "name": "大煮干丝", "category": "meat", "minutes": 30,
    amounts: {"tofu-sheets": 250, "ham": 40, "peeled-shrimp": 100, "ginger": 10, "salt": 0.5, "water": 500},
    steps: ["prep", "tofu-strips", "tofu-strip-soup", "serve"], tip: "balanced",
    aliases: ["Huaiyang shredded tofu soup"] },
  {"id": "su-rice", "cuisine": "su", "name": "扬州炒饭", "category": "staple", "minutes": 30,
    amounts: {"rice": 300, "egg": 2, "peeled-shrimp": 100, "ham": 30, "peas": 60, "carrot": 60, "oil": 10, "salt": 0.5},
    steps: ["prep", "fried-rice-prep", "yangzhou", "serve"], tip: "balanced",
    aliases: ["Yangzhou fried rice"] },
  {"id": "su-duck", "cuisine": "su", "name": "盐水鸭", "category": "meat", "minutes": 190,
    amounts: {"duck": 450, "ginger": 20, "scallion": 20, "peppercorn": 2, "salt": 4, "water": 1200},
    steps: ["prep", "duck-salt", "duck-poach", "duck-slice"], tip: "salty",
    aliases: ["Nanjing saltwater duck"] },
  {"id": "su-ribs", "cuisine": "su", "name": "无锡酱排骨", "category": "meat", "minutes": 85,
    amounts: {"ribs": 400, "ginger": 15, "star-anise": 1, "soy": 12, "dark-soy": 5, "sugar": 15, "water": 600},
    steps: ["prep", "ribs-braise", "reduce", "serve"], tip: "sweet",
    aliases: ["Wuxi sweet soy ribs"] },
  {"id": "su-tea-shrimp", "cuisine": "su", "name": "碧螺虾仁", "category": "meat", "minutes": 25,
    amounts: {"peeled-shrimp": 300, "biluochun": 2, "starch": 5, "oil": 8, "salt": 0.5, "water": 60},
    steps: ["prep", "tea", "tea-shrimp", "serve"], tip: "balanced",
    aliases: ["Biluochun tea shrimp"] },
  {"id": "su-wensi", "cuisine": "su", "name": "文思豆腐", "category": "meat", "minutes": 35,
    amounts: {"soft-tofu": 300, "ham": 30, "salt": 0.5, "starch": 5, "water": 600},
    steps: ["prep", "wensi", "wensi-soup", "slurry"], tip: "balanced",
    aliases: ["Wensi tofu thread soup"] },
  {"id": "su-crab-tofu", "cuisine": "su", "name": "蟹粉豆腐", "category": "meat", "minutes": 25,
    amounts: {"soft-tofu": 300, "crab-meat": 120, "ginger": 10, "starch": 6, "oil": 8, "salt": 0.5, "water": 150},
    steps: ["prep", "tofu", "crab-tofu", "slurry"], tip: "bones",
    aliases: ["Tofu with crab meat"] },
  {"id": "su-fish", "cuisine": "su", "name": "苏式熏鱼", "category": "meat", "minutes": 45,
    amounts: {"grass-carp": 400, "ginger": 10, "soy": 12, "dark-soy": 5, "sugar": 15, "star-anise": 1, "starch": 15, "oil": 70, "water": 180},
    steps: ["prep", "fish-coat", "smoked-fish", "fish-fry", "fish-soak"], tip: "rich",
    aliases: ["Suzhou sauce-soaked fried fish"] },
  {"id": "su-pastry", "cuisine": "su", "name": "黄桥烧饼", "category": "staple", "minutes": 70,
    amounts: {"flour": 200, "lard": 30, "ham": 40, "scallion": 20, "sesame": 12, "water": 80},
    steps: ["prep", "pastry-dough", "pastry-shape", "pastry-bake"], tip: "rich",
    aliases: ["Huangqiao sesame pastry"] },
  {"id": "min-lychee", "cuisine": "min", "name": "荔枝肉", "category": "meat", "minutes": 45,
    amounts: {"pork": 250, "potato": 150, "soy": 5, "starch": 30, "ketchup": 20, "vinegar": 20, "sugar": 12, "oil": 70, "water": 100},
    steps: ["prep", "lychee", "pork-fry", "sweet-sour", "potato-boil"], tip: "rich",
    aliases: ["荔枝形肉块", "Lychee-cut sweet-and-sour pork"] },
  {"id": "min-fishballs", "cuisine": "min", "name": "福州鱼丸", "category": "meat", "minutes": 55,
    amounts: {"snakehead": 300, "minced-pork": 100, "ginger": 5, "soy": 5, "salt": 1, "sweet-starch": 50, "water": 120},
    steps: ["prep", "fish-paste", "fishball-fill", "fishball-poach"], tip: "balanced",
    aliases: ["Fuzhou stuffed fish balls"] },
  {"id": "min-oyster", "cuisine": "min", "name": "海蛎煎", "category": "meat", "minutes": 25,
    amounts: {"oyster-meat": 200, "egg": 2, "sweet-starch": 60, "chives": 60, "salt": 0.5, "oil": 12, "water": 100},
    steps: ["prep", "oyster-mix", "oyster-fry", "serve"], tip: "balanced",
    aliases: ["Fujian oyster omelet"] },
  {"id": "min-red-chicken", "cuisine": "min", "name": "红糟鸡", "category": "meat", "minutes": 85,
    amounts: {"chicken-leg": 400, "red-lees": 30, "ginger": 15, "soy": 8, "oil": 10, "water": 250},
    steps: ["chicken-cut", "red-chicken", "red-braise", "reduce"], tip: "alcohol",
    aliases: ["Chicken braised with red lees"] },
  {"id": "min-ribs", "cuisine": "min", "name": "醉排骨", "category": "meat", "minutes": 55,
    amounts: {"ribs": 350, "garlic": 4, "soy": 8, "vinegar": 15, "sugar": 10, "oil": 15, "water": 800},
    steps: ["prep", "drunken-ribs", "ribs-dressing", "serve"], tip: "balanced",
    aliases: ["Fuzhou sweet-sour garlic ribs"] },
  {"id": "min-conch", "cuisine": "min", "name": "淡糟香螺片", "category": "meat", "minutes": 35,
    amounts: {"conch": 250, "red-lees": 20, "ginger": 10, "garlic": 2, "soy": 5, "oil": 8, "water": 60},
    steps: ["prep", "conch", "conch-red", "serve"], tip: "alcohol",
    aliases: ["Sea-snail slices with red lees"] },
  {"id": "min-clams", "cuisine": "min", "name": "鸡汤汆海蚌", "category": "meat", "minutes": 65,
    amounts: {"clams": 400, "chicken-leg": 250, "ginger": 15, "salt": 0.5, "water": 1000},
    steps: ["prep", "clam-soup", "clams", "salt-finish"], tip: "bones",
    aliases: ["Clams in chicken broth"] },
  {"id": "min-crab-rice", "cuisine": "min", "name": "八宝红鲟饭", "category": "staple", "minutes": 200,
    amounts: {"crab": 400, "sticky-rice": 150, "mushroom": 60, "chestnut": 50, "lotus-seed": 20, "dried-shrimp": 10, "ginger": 8, "soy": 8, "water": 180, "ham": 30, "bamboo": 50, "carrot": 40, "peas": 30},
    steps: ["prep", "sticky-soak", "bamboo", "shrimp-soak", "crab-rice-complete", "sticky-finish"], tip: "bones",
    aliases: ["Mud crab over eight-treasure sticky rice"] },
  {"id": "min-duck", "cuisine": "min", "name": "姜母鸭", "category": "meat", "minutes": 90,
    amounts: {"duck": 450, "ginger": 80, "soy": 12, "sugar": 5, "oil": 12, "water": 550},
    steps: ["prep", "ginger-duck", "duck-braise", "serve"], tip: "balanced",
    aliases: ["Ginger-braised duck"] },
  {"id": "min-rice", "cuisine": "min", "name": "闽南咸饭", "category": "staple", "minutes": 80,
    amounts: {"raw-rice": 160, "belly": 120, "cabbage": 200, "mushroom": 60, "dried-shrimp": 10, "soy": 10, "oil": 5, "water": 260},
    steps: ["prep", "rice-soak", "shrimp-soak", "min-rice", "rice-check"], tip: "balanced",
    aliases: ["Southern Fujian savory rice"] },
  {"id": "min-beef", "cuisine": "min", "name": "沙茶牛肉", "category": "meat", "minutes": 30,
    amounts: {"beef": 250, "celery": 150, "garlic": 3, "shacha": 15, "soy": 5, "starch": 5, "oil": 8, "water": 40},
    steps: ["prep", "beef", "shacha", "serve"], tip: "salty",
    aliases: ["Shacha beef"] },
  {"id": "min-taro", "cuisine": "min", "name": "太极芋泥", "category": "staple", "minutes": 120,
    amounts: {"taro": 350, "red-bean": 80, "lotus-seed": 20, "sugar": 20, "lard": 15, "water": 120},
    steps: ["prep", "lotus-soak", "lotus-boil", "taro", "taro-paste", "taiji"], tip: "sweet",
    aliases: ["Yin-yang taro and bean paste"] },
  {"id": "zhe-vinegar-fish", "cuisine": "zhe", "name": "西湖醋鱼", "category": "meat", "minutes": 30,
    amounts: {"grass-carp": 400, "ginger": 15, "soy": 10, "vinegar": 25, "sugar": 15, "starch": 8, "water": 900},
    steps: ["prep", "vinegar-fish", "vinegar-glaze", "serve"], tip: "bones",
    aliases: ["West Lake vinegar fish"] },
  {"id": "zhe-dongpo", "cuisine": "zhe", "name": "东坡肉", "category": "meat", "minutes": 150,
    amounts: {"belly": 400, "scallion": 25, "ginger": 20, "soy": 15, "dark-soy": 5, "sugar": 15, "rice-wine": 80, "water": 450},
    steps: ["prep", "belly", "dongpo", "reduce"], tip: "alcohol",
    aliases: ["Dongpo braised pork"] },
  {"id": "zhe-tea-shrimp", "cuisine": "zhe", "name": "龙井虾仁", "category": "meat", "minutes": 25,
    amounts: {"peeled-shrimp": 300, "longjing": 2, "starch": 5, "oil": 8, "salt": 0.5, "water": 60},
    steps: ["prep", "tea", "tea-shrimp", "serve"], tip: "balanced",
    aliases: ["Longjing tea shrimp"] },
  {"id": "zhe-rolls", "cuisine": "zhe", "name": "干炸响铃", "category": "meat", "minutes": 40,
    amounts: {"tofu-skin": 80, "minced-pork": 200, "ginger": 8, "soy": 8, "starch": 5, "oil": 70, "water": 20},
    steps: ["prep", "tofu-roll", "roll-fry", "serve"], tip: "rich",
    aliases: ["Crisp tofu-skin pork rolls"] },
  {"id": "zhe-fish-soup", "cuisine": "zhe", "name": "宋嫂鱼羹", "category": "meat", "minutes": 40,
    amounts: {"seabass": 300, "ginger": 10, "mushroom": 80, "ham": 30, "egg": 1, "soy": 5, "vinegar": 12, "starch": 8, "water": 650},
    steps: ["prep", "fish-soup", "sister-soup", "slurry"], tip: "balanced",
    aliases: ["Sister Song fish soup"] },
  {"id": "zhe-bamboo", "cuisine": "zhe", "name": "油焖春笋", "category": "plant", "minutes": 50,
    amounts: {"bamboo": 400, "soy": 10, "dark-soy": 3, "sugar": 6, "oil": 12, "water": 150},
    steps: ["prep", "bamboo", "bamboo-braise", "serve"], tip: "balanced",
    aliases: ["Soy-braised spring bamboo shoots"] },
  {"id": "zhe-croaker", "cuisine": "zhe", "name": "雪菜黄鱼", "category": "meat", "minutes": 35,
    amounts: {"yellow-croaker": 450, "snow-greens": 80, "ginger": 15, "oil": 10, "water": 300},
    steps: ["prep", "salted-veg", "yellow-fish", "serve"], tip: "salty",
    aliases: ["Yellow croaker with preserved greens"] },
  {"id": "zhe-tangyuan", "cuisine": "zhe", "name": "宁波汤圆", "category": "staple", "minutes": 60,
    amounts: {"glutinous-flour": 150, "black-sesame": 50, "sugar": 20, "lard": 15, "water": 110},
    steps: ["prep", "sesame-fill", "tangyuan", "tangyuan-boil"], tip: "sweet",
    aliases: ["Ningbo black sesame rice balls"] },
  {"id": "zhe-drunken-chicken", "cuisine": "zhe", "name": "绍兴醉鸡", "category": "meat", "minutes": 200,
    amounts: {"chicken-leg": 450, "ginger": 15, "scallion": 20, "zaolu": 200, "water": 1000},
    steps: ["prep", "poach-chicken", "drunken-chicken", "serve"], tip: "alcohol",
    aliases: ["Shaoxing-style lees-scented chicken"] },
  {"id": "zhe-meicai", "cuisine": "zhe", "name": "梅干菜扣肉", "category": "meat", "minutes": 130,
    amounts: {"belly": 350, "dried-greens": 60, "soy": 10, "dark-soy": 5, "sugar": 8, "water": 100},
    steps: ["prep", "dried-greens", "belly", "meicai-pork", "invert"], tip: "rich",
    aliases: ["Steamed pork belly with dried greens"] },
  {"id": "zhe-dried-bamboo", "cuisine": "zhe", "name": "干菜焖笋", "category": "plant", "minutes": 60,
    amounts: {"bamboo": 350, "dried-greens": 40, "soy": 5, "oil": 8, "water": 180},
    steps: ["prep", "bamboo", "dried-greens", "dried-bamboo"], tip: "salty",
    aliases: ["Bamboo shoots with dried greens"] },
  {"id": "zhe-duck", "cuisine": "zhe", "name": "杭州酱鸭", "category": "meat", "minutes": 140,
    amounts: {"duck": 450, "ginger": 15, "soy": 15, "dark-soy": 5, "sugar": 10, "star-anise": 1, "water": 600},
    steps: ["prep", "soy-duck", "reduce", "duck-slice"], tip: "salty",
    aliases: ["Hangzhou soy-braised duck"] },
  {"id": "xiang-fish-head", "cuisine": "xiang", "name": "剁椒鱼头", "category": "meat", "minutes": 40,
    amounts: {"fish-head": 500, "fermented-chili": 35, "ginger": 20, "scallion": 20, "soy": 5, "oil": 8},
    steps: ["prep", "fish-head", "head-steam", "serve"], tip: "salty",
    aliases: ["Fish head steamed with chopped chili"] },
  {"id": "xiang-beef", "cuisine": "xiang", "name": "小炒黄牛肉", "category": "meat", "minutes": 30,
    amounts: {"beef": 250, "chili": 30, "celery": 100, "ginger": 10, "garlic": 3, "soy": 8, "starch": 5, "oil": 10, "water": 20},
    steps: ["prep", "beef", "hunan-beef", "serve"], tip: "balanced",
    aliases: ["Hunan chili beef stir-fry"] },
  {"id": "xiang-pork", "cuisine": "xiang", "name": "辣椒炒肉", "category": "meat", "minutes": 30,
    amounts: {"pork": 220, "pepper": 250, "garlic": 3, "soy": 8, "oil": 10, "salt": 0.25},
    steps: ["prep", "pepper-pork", "salt-finish", "serve"], tip: "balanced",
    aliases: ["Hunan pork and peppers"] },
  {"id": "xiang-tofu", "cuisine": "xiang", "name": "香干炒肉", "category": "meat", "minutes": 25,
    amounts: {"pork": 180, "smoked-tofu": 180, "garlic": 2, "chili": 15, "soy": 8, "oil": 8, "salt": 0.25},
    steps: ["prep", "smoked-tofu", "salt-finish", "serve"], tip: "balanced",
    aliases: ["Smoked tofu with pork"] },
  {"id": "xiang-cured", "cuisine": "xiang", "name": "腊味合蒸", "category": "meat", "minutes": 70,
    amounts: {"cured-pork": 150, "cured-fish": 150, "ginger": 20},
    steps: ["prep", "cured", "cured-steam", "serve"], tip: "salty",
    aliases: ["Steamed cured pork and fish"] },
  {"id": "xiang-red-pork", "cuisine": "xiang", "name": "毛氏红烧肉", "category": "meat", "minutes": 110,
    amounts: {"belly": 350, "scallion": 15, "ginger": 15, "soy": 10, "dark-soy": 3, "sugar": 12, "star-anise": 1, "water": 600},
    steps: ["prep", "belly", "belly-braise", "reduce"], tip: "rich",
    aliases: ["Hunan red-braised pork belly"] },
  {"id": "xiang-cabbage", "cuisine": "xiang", "name": "手撕包菜", "category": "plant", "minutes": 20,
    amounts: {"round-cabbage": 400, "garlic": 3, "dried-chili": 4, "soy": 8, "vinegar": 8, "oil": 8},
    steps: ["prep", "cabbage", "cabbage-fry", "serve"], tip: "balanced",
    aliases: ["Hand-torn cabbage stir-fry"] },
  {"id": "xiang-cauliflower", "cuisine": "xiang", "name": "干锅花菜", "category": "meat", "minutes": 30,
    amounts: {"cauliflower": 350, "belly": 100, "garlic": 3, "dried-chili": 5, "soy": 8, "oil": 5},
    steps: ["prep", "cauliflower", "cauliflower-fry", "serve"], tip: "balanced",
    aliases: ["Dry-pot cauliflower"] },
  {"id": "xiang-crayfish", "cuisine": "xiang", "name": "口味虾", "category": "meat", "minutes": 55,
    amounts: {"crayfish": 600, "ginger": 20, "garlic": 5, "bean-paste": 15, "dried-chili": 8, "soy": 10, "oil": 15, "water": 500},
    steps: ["prep", "crayfish", "crayfish-cook", "reduce"], tip: "bones",
    aliases: ["Hunan spicy crayfish"] },
  {"id": "xiang-duck", "cuisine": "xiang", "name": "啤酒鸭", "category": "meat", "minutes": 80,
    amounts: {"duck": 450, "ginger": 20, "garlic": 3, "soy": 12, "beer": 300, "water": 250, "oil": 10},
    steps: ["prep", "ginger-duck", "beer-duck", "reduce"], tip: "alcohol",
    aliases: ["Beer-braised duck"] },
  {"id": "xiang-waipo", "cuisine": "xiang", "name": "湘西外婆菜", "category": "meat", "minutes": 20,
    amounts: {"waipo": 160, "minced-pork": 100, "garlic": 2, "chili": 15, "oil": 8, "salt": 0.25},
    steps: ["prep", "waipo", "salt-finish", "serve"], tip: "salty",
    aliases: ["Western Hunan preserved-vegetable stir-fry"] },
  {"id": "xiang-egg-peppers", "cuisine": "xiang", "name": "擂辣椒皮蛋", "category": "plant", "minutes": 25,
    amounts: {"pepper": 250, "preserved-egg": 2, "garlic": 3, "soy": 5, "vinegar": 8},
    steps: ["prep", "pepper-roast", "pound-egg", "serve"], tip: "balanced",
    aliases: ["Pounded peppers and preserved egg"] },
  {"id": "hui-fish", "cuisine": "hui", "name": "臭鳜鱼", "category": "meat", "minutes": 40,
    amounts: {"fermented-fish": 400, "ginger": 15, "garlic": 3, "soy": 5, "oil": 10, "water": 250},
    steps: ["prep", "fermented-fish", "hui-fish", "serve"], tip: "salty",
    aliases: ["Anhui fermented mandarin fish"] },
  {"id": "hui-tofu", "cuisine": "hui", "name": "虎皮毛豆腐", "category": "plant", "minutes": 30,
    amounts: {"hairy-tofu": 300, "garlic": 3, "soy": 8, "oil": 12, "water": 80},
    steps: ["prep", "hairy-tofu", "hairy-fry", "serve"], tip: "salty",
    aliases: ["毛豆腐", "Golden pan-fried hairy tofu"] },
  {"id": "hui-pigeon", "cuisine": "hui", "name": "黄山炖鸽", "category": "meat", "minutes": 85,
    amounts: {"pigeon": 400, "mushroom": 100, "ginger": 15, "salt": 1, "water": 1000},
    steps: ["prep", "pigeon", "salt-finish", "serve"], tip: "balanced",
    aliases: ["Huangshan pigeon soup"] },
  {"id": "hui-onepot", "cuisine": "hui", "name": "胡适一品锅", "category": "meat", "minutes": 90,
    amounts: {"cabbage": 200, "tofu": 150, "belly": 120, "chicken-leg": 200, "mushroom": 80, "quail-eggs": 60, "ginger": 15, "soy": 8, "water": 650},
    steps: ["prep", "belly", "onepot-blanched", "onepot-cook"], tip: "balanced",
    aliases: ["Hu Shi layered family hot pot"] },
  {"id": "hui-bamboo", "cuisine": "hui", "name": "问政山笋", "category": "meat", "minutes": 60,
    amounts: {"bamboo": 350, "ham": 60, "mushroom": 80, "ginger": 10, "water": 350},
    steps: ["prep", "bamboo", "ham-bamboo", "serve"], tip: "salty",
    aliases: ["Wenzheng bamboo shoots"] },
  {"id": "hui-chop-suey", "cuisine": "hui", "name": "李鸿章杂烩", "category": "meat", "minutes": 50,
    amounts: {"chicken": 200, "squid": 150, "ham": 40, "mushroom": 80, "cabbage": 150, "ginger": 10, "soy": 5, "starch": 5, "water": 600},
    steps: ["prep", "chop-suey", "slurry", "serve"], tip: "balanced",
    aliases: ["Li Hongzhang mixed-ingredient stew"] },
  {"id": "hui-chicken", "cuisine": "hui", "name": "徽州蒸鸡", "category": "meat", "minutes": 70,
    amounts: {"chicken-leg": 400, "mushroom": 120, "ginger": 15, "soy": 8},
    steps: ["prep", "chicken-cut", "hui-chicken", "serve"], tip: "balanced",
    aliases: ["Huizhou steamed chicken"] },
  {"id": "hui-balls", "cuisine": "hui", "name": "徽州圆子", "category": "meat", "minutes": 45,
    amounts: {"minced-pork": 250, "tofu": 100, "ginger": 8, "potato-starch": 25, "salt": 1},
    steps: ["prep", "hui-balls", "balls-steam", "serve"], tip: "balanced",
    aliases: ["Huizhou pork and tofu balls"] },
  {"id": "hui-noodles", "cuisine": "hui", "name": "绩溪炒粉丝", "category": "staple", "minutes": 30,
    amounts: {"vermicelli": 100, "belly": 100, "cabbage": 150, "mushroom": 80, "garlic": 2, "soy": 10, "oil": 5, "water": 200},
    steps: ["prep", "vermicelli", "jixi", "serve"], tip: "balanced",
    aliases: ["Jixi stir-fried glass noodles"] },
  {"id": "hui-pork", "cuisine": "hui", "name": "刀板香", "category": "meat", "minutes": 80,
    amounts: {"cured-pork": 250, "ginger": 15, "cucumber": 150, "water": 900},
    steps: ["prep", "cured", "daoban", "serve"], tip: "salty",
    aliases: ["Huizhou sliced cured pork"] },
  {"id": "hui-stone-chicken", "cuisine": "hui", "name": "石耳炖鸡", "category": "meat", "minutes": 80,
    amounts: {"chicken-leg": 400, "stone-ear": 12, "ginger": 15, "salt": 1, "water": 1000},
    steps: ["prep", "stone-ear", "chicken-cut", "stone-chicken"], tip: "balanced",
    aliases: ["Chicken with rock ear mushrooms"] },
  {"id": "hui-taguo", "cuisine": "hui", "name": "挞馃", "category": "staple", "minutes": 60,
    amounts: {"flour": 200, "chives": 150, "dried-tofu": 100, "salt": 1, "oil": 15, "water": 110},
    steps: ["prep", "taguo-dough", "taguo-shape", "taguo-fry"], tip: "balanced",
    aliases: ["Huizhou chive and tofu flatbread"] },
];
export const REGIONAL_RECIPES = DISHES.map(({amounts, steps, tip, ...recipe}) => ({
  ...recipe, servings: 2, emoji: {plant: '🥬', meat: '🍲', staple: '🍚'}[recipe.category],
  ingredients: Object.entries(amounts).map(([key, amount]) => ({key, amount})),
  steps: steps.map(code => STEPS[code]), tip: TIPS[tip]
}));
