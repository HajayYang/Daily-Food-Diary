import { CUISINES, REGIONAL_INGREDIENTS, REGIONAL_RECIPES } from './regional-recipes.js';
export { CUISINES } from './regional-recipes.js';
// Original home recipes. Ingredient amounts use raw edible weight, except cooked rice.
const HOME_INGREDIENTS = {
  "tomato": {
    "name": "番茄",
    "unit": "g",
    "allergens": []
  },
  "egg": {
    "name": "鸡蛋",
    "unit": "个",
    "allergens": [
      "egg"
    ]
  },
  "oil": {
    "name": "食用油",
    "unit": "g",
    "allergens": []
  },
  "salt": {
    "name": "盐",
    "unit": "g",
    "allergens": []
  },
  "water": {
    "name": "水",
    "unit": "ml",
    "allergens": []
  },
  "potato": {
    "name": "土豆",
    "unit": "g",
    "allergens": []
  },
  "garlic": {
    "name": "蒜",
    "unit": "瓣",
    "allergens": []
  },
  "vinegar": {
    "name": "米醋",
    "unit": "ml",
    "allergens": []
  },
  "chili": {
    "name": "鲜辣椒（可省略）",
    "unit": "g",
    "allergens": []
  },
  "broccoli": {
    "name": "西兰花",
    "unit": "g",
    "allergens": []
  },
  "chicken": {
    "name": "去皮鸡胸肉",
    "unit": "g",
    "allergens": []
  },
  "mushroom": {
    "name": "鲜香菇",
    "unit": "g",
    "allergens": []
  },
  "soy": {
    "name": "生抽（核对配料）",
    "unit": "ml",
    "allergens": [
      "soy",
      "gluten"
    ]
  },
  "ginger": {
    "name": "姜",
    "unit": "g",
    "allergens": []
  },
  "pork": {
    "name": "瘦猪肉",
    "unit": "g",
    "allergens": []
  },
  "pepper": {
    "name": "青椒",
    "unit": "g",
    "allergens": []
  },
  "starch": {
    "name": "玉米淀粉",
    "unit": "g",
    "allergens": []
  },
  "tofu": {
    "name": "北豆腐",
    "unit": "g",
    "allergens": [
      "soy"
    ]
  },
  "carrot": {
    "name": "胡萝卜",
    "unit": "g",
    "allergens": []
  },
  "greens": {
    "name": "小白菜",
    "unit": "g",
    "allergens": []
  },
  "fish": {
    "name": "去刺鱼柳",
    "unit": "g",
    "allergens": [
      "fish"
    ]
  },
  "scallion": {
    "name": "葱",
    "unit": "g",
    "allergens": []
  },
  "cucumber": {
    "name": "黄瓜",
    "unit": "g",
    "allergens": []
  },
  "rice": {
    "name": "熟米饭",
    "unit": "g",
    "allergens": []
  },
  "peas": {
    "name": "豌豆",
    "unit": "g",
    "allergens": []
  },
  "noodles": {
    "name": "干面条",
    "unit": "g",
    "allergens": [
      "gluten"
    ]
  }
};
const HOME_RECIPES = [
  {
    "id": "tomato-eggs",
    "name": "番茄炒蛋",
    "category": "plant",
    "emoji": "🍅",
    "minutes": 15,
    "servings": 2,
    "aliases": [
      "西红柿炒鸡蛋",
      "西红柿炒蛋",
      "番茄炒鸡蛋",
      "tomato eggs"
    ],
    "ingredients": [
      {
        "key": "tomato",
        "amount": 300
      },
      {
        "key": "egg",
        "amount": 2
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "salt",
        "amount": 1
      },
      {
        "key": "water",
        "amount": 30
      }
    ],
    "steps": [
      "番茄洗净切块，鸡蛋打散；食材用量按生重、可食部分计。",
      "中火热锅，加入一半油，倒入蛋液炒至凝固，盛出。",
      "加入剩余油和番茄，翻炒约 3 分钟；加水焖 2 分钟至出汁。",
      "倒回鸡蛋，加盐翻炒均匀，确保蛋液完全凝固后出锅。"
    ],
    "tip": "搭配杂粮饭和一份绿叶菜；番茄本身有甜味，可不另加糖。"
  },
  {
    "id": "potato",
    "name": "酸辣土豆丝",
    "category": "plant",
    "emoji": "🥔",
    "minutes": 20,
    "servings": 2,
    "aliases": [
      "土豆丝",
      "potato stir fry"
    ],
    "ingredients": [
      {
        "key": "potato",
        "amount": 300
      },
      {
        "key": "garlic",
        "amount": 2
      },
      {
        "key": "vinegar",
        "amount": 10
      },
      {
        "key": "chili",
        "amount": 5
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "salt",
        "amount": 1
      }
    ],
    "steps": [
      "土豆去皮切细丝，清水冲洗表面淀粉后沥干；蒜切片，辣椒切丝。",
      "中火热油，放蒜和可选辣椒炒出香味，避免炒焦。",
      "倒入土豆丝，转中大火翻炒约 4–6 分钟；若粘锅，可少量分次加水。",
      "加米醋和盐炒匀，确认土豆无生硬芯后出锅。"
    ],
    "tip": "土豆可计入主食份量，这餐可适当少盛米饭，再搭配豆腐或瘦肉。"
  },
  {
    "id": "broccoli",
    "name": "蒜蓉西兰花",
    "category": "plant",
    "emoji": "🥦",
    "minutes": 15,
    "servings": 2,
    "aliases": [
      "花椰菜",
      "garlic broccoli"
    ],
    "ingredients": [
      {
        "key": "broccoli",
        "amount": 350
      },
      {
        "key": "garlic",
        "amount": 3
      },
      {
        "key": "oil",
        "amount": 6
      },
      {
        "key": "salt",
        "amount": 1
      },
      {
        "key": "water",
        "amount": 30
      }
    ],
    "steps": [
      "西兰花切小朵，茎去硬皮后切片，流水洗净；蒜切末。",
      "锅中水烧开，放西兰花焯约 1 分钟，捞出沥水。",
      "中小火热油，蒜末炒香，倒入西兰花翻炒。",
      "加水和盐，翻炒约 2–3 分钟，至茎部熟透即可。"
    ],
    "tip": "作为蔬菜配菜，另搭配主食和鱼、蛋或豆制品，组成完整一餐。"
  },
  {
    "id": "chicken",
    "name": "香菇炒鸡胸肉",
    "category": "meat",
    "emoji": "🍗",
    "minutes": 25,
    "servings": 2,
    "aliases": [
      "鸡肉",
      "鸡丁",
      "chicken mushroom"
    ],
    "ingredients": [
      {
        "key": "chicken",
        "amount": 250
      },
      {
        "key": "mushroom",
        "amount": 150
      },
      {
        "key": "ginger",
        "amount": 5
      },
      {
        "key": "soy",
        "amount": 5
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "water",
        "amount": 40
      }
    ],
    "steps": [
      "香菇洗净切片，姜切丝；鸡胸肉用独立刀板切薄片，不冲洗生鸡肉。",
      "鸡肉拌生抽腌 5 分钟，接触过生肉的手和器具及时清洗。",
      "中火热油炒香姜丝，加入鸡片炒至表面变色，再放香菇翻炒。",
      "加水盖锅焖约 5–8 分钟，翻匀并确认鸡肉中心至少达到 74°C，熟透再出锅。"
    ],
    "tip": "搭配糙米饭与时蔬；生抽含钠，不必再额外加盐。"
  },
  {
    "id": "pork",
    "name": "青椒肉丝",
    "category": "meat",
    "emoji": "🥩",
    "minutes": 25,
    "servings": 2,
    "aliases": [
      "青椒炒肉",
      "肉丝",
      "pork pepper"
    ],
    "ingredients": [
      {
        "key": "pork",
        "amount": 200
      },
      {
        "key": "pepper",
        "amount": 250
      },
      {
        "key": "starch",
        "amount": 5
      },
      {
        "key": "soy",
        "amount": 5
      },
      {
        "key": "ginger",
        "amount": 5
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "water",
        "amount": 30
      }
    ],
    "steps": [
      "青椒洗净去籽切丝，姜切丝；瘦肉用另一块刀板切丝。",
      "肉丝加入生抽、淀粉和少量配方内的水拌匀，腌 5 分钟。",
      "中火热油炒香姜，放肉丝炒散至变色，加入青椒翻炒约 3 分钟。",
      "加剩余水焖炒至肉丝完全熟透、无生肉质感，青椒软硬按口味调整。"
    ],
    "tip": "优先选择瘦肉，配一份主食；酱油的过敏原以实际标签为准。"
  },
  {
    "id": "tofu",
    "name": "家常豆腐",
    "category": "plant",
    "emoji": "🧊",
    "minutes": 25,
    "servings": 2,
    "aliases": [
      "煎豆腐",
      "tofu vegetables"
    ],
    "ingredients": [
      {
        "key": "tofu",
        "amount": 300
      },
      {
        "key": "carrot",
        "amount": 100
      },
      {
        "key": "pepper",
        "amount": 100
      },
      {
        "key": "garlic",
        "amount": 2
      },
      {
        "key": "soy",
        "amount": 5
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "water",
        "amount": 80
      }
    ],
    "steps": [
      "豆腐沥水切厚片，胡萝卜和青椒切片，蒜切末。",
      "不粘锅中火加油，豆腐平铺，煎至两面浅金黄后盛出。",
      "原锅放蒜、胡萝卜和青椒翻炒 2 分钟，加入生抽和水。",
      "放回豆腐，小火煮约 5 分钟至蔬菜熟透，轻推拌匀后出锅。"
    ],
    "tip": "豆腐可作为植物蛋白来源，搭配杂粮饭与绿叶蔬菜；无需油炸。"
  },
  {
    "id": "greens",
    "name": "香菇炒青菜",
    "category": "plant",
    "emoji": "🥬",
    "minutes": 15,
    "servings": 2,
    "aliases": [
      "小白菜",
      "油菜",
      "青菜",
      "bok choy"
    ],
    "ingredients": [
      {
        "key": "greens",
        "amount": 300
      },
      {
        "key": "mushroom",
        "amount": 120
      },
      {
        "key": "garlic",
        "amount": 2
      },
      {
        "key": "oil",
        "amount": 6
      },
      {
        "key": "salt",
        "amount": 1
      },
      {
        "key": "water",
        "amount": 30
      }
    ],
    "steps": [
      "小白菜掰开洗净，菜梗和菜叶分开；香菇切片，蒜切末。",
      "中火热油，蒜末炒香，香菇先炒约 2 分钟。",
      "放菜梗翻炒 1 分钟，再加入菜叶和水。",
      "继续翻炒约 2–3 分钟至香菇与菜梗熟透，加盐拌匀。"
    ],
    "tip": "焯煮或快炒可减少额外用油，配豆腐、蛋或鱼补充蛋白质。"
  },
  {
    "id": "fish",
    "name": "清蒸鱼柳",
    "category": "meat",
    "emoji": "🐟",
    "minutes": 20,
    "servings": 2,
    "aliases": [
      "蒸鱼",
      "鱼肉",
      "steamed fish"
    ],
    "ingredients": [
      {
        "key": "fish",
        "amount": 300
      },
      {
        "key": "ginger",
        "amount": 10
      },
      {
        "key": "scallion",
        "amount": 10
      },
      {
        "key": "soy",
        "amount": 5
      },
      {
        "key": "oil",
        "amount": 4
      }
    ],
    "steps": [
      "解冻后的鱼柳擦干、检查残留鱼刺，放耐热盘；姜切丝，葱切段。",
      "鱼上铺姜丝和一半葱，蒸锅加水烧开。",
      "放入鱼盘，大火蒸约 8–12 分钟，按厚度延长；中心达到 63°C、鱼肉易分片再取出。",
      "小心取出倒去部分蒸汁，淋生抽和油，撒剩余葱；食用时仍需留意鱼刺。"
    ],
    "tip": "配米饭和两种蔬菜；鱼类和酱油相关过敏者应另选菜谱。"
  },
  {
    "id": "cucumber",
    "name": "蒜香拍黄瓜",
    "category": "plant",
    "emoji": "🥒",
    "minutes": 10,
    "servings": 2,
    "aliases": [
      "凉拌黄瓜",
      "拍黄瓜",
      "cucumber salad"
    ],
    "ingredients": [
      {
        "key": "cucumber",
        "amount": 300
      },
      {
        "key": "garlic",
        "amount": 2
      },
      {
        "key": "vinegar",
        "amount": 10
      },
      {
        "key": "oil",
        "amount": 4
      },
      {
        "key": "salt",
        "amount": 1
      }
    ],
    "steps": [
      "洗净双手和熟食刀板，黄瓜流水洗净，去两端。",
      "用刀面轻拍黄瓜使其裂开，再切成易入口小块。",
      "蒜切末，与米醋、油和盐在干净碗中拌匀。",
      "加入黄瓜拌匀，现拌现吃；暂不食用时及时加盖冷藏。"
    ],
    "tip": "清爽配菜不替代主餐，搭配全谷物和蛋白质食物。"
  },
  {
    "id": "custard",
    "name": "嫩滑蒸蛋",
    "category": "plant",
    "emoji": "🥚",
    "minutes": 20,
    "servings": 2,
    "aliases": [
      "蒸鸡蛋",
      "鸡蛋羹",
      "水蒸蛋",
      "steamed eggs"
    ],
    "ingredients": [
      {
        "key": "egg",
        "amount": 2
      },
      {
        "key": "water",
        "amount": 150
      },
      {
        "key": "salt",
        "amount": 0.5
      },
      {
        "key": "oil",
        "amount": 2
      },
      {
        "key": "scallion",
        "amount": 5
      }
    ],
    "steps": [
      "鸡蛋打散，加入盐和温水拌匀；水温以不烫手为宜。",
      "蛋液过滤到耐热碗，撇去泡沫，盖耐热盘防滴水。",
      "蒸锅水沸后放入，中小火蒸约 10–15 分钟；份量或深度增加时延长。",
      "确认中心完全凝固、无流动蛋液后取出，淋油并撒洗净的葱花。"
    ],
    "tip": "鸡蛋提供蛋白质，但蒸蛋不能替代蔬菜和主食。"
  },
  {
    "id": "fried-rice",
    "name": "蔬菜蛋炒饭",
    "category": "staple",
    "emoji": "🍚",
    "minutes": 20,
    "servings": 2,
    "aliases": [
      "蛋炒饭",
      "炒饭",
      "fried rice"
    ],
    "ingredients": [
      {
        "key": "rice",
        "amount": 300
      },
      {
        "key": "egg",
        "amount": 2
      },
      {
        "key": "carrot",
        "amount": 100
      },
      {
        "key": "peas",
        "amount": 100
      },
      {
        "key": "oil",
        "amount": 8
      },
      {
        "key": "salt",
        "amount": 1
      }
    ],
    "steps": [
      "胡萝卜切小丁，豌豆洗净，鸡蛋打散；用新煮米饭，或及时冷藏且保存得当的米饭。",
      "胡萝卜丁和豌豆先入沸水煮约 3–5 分钟至熟，沥水。",
      "中火热油，将蛋液炒至凝固，加入米饭打散翻炒。",
      "加入熟蔬菜和盐，持续翻炒至全部热透、冒热气；米饭只复热一次。"
    ],
    "tip": "可用部分糙米替代白米，另添一份绿叶菜；不使用室温久放的剩饭。"
  },
  {
    "id": "noodles",
    "name": "番茄鸡蛋面",
    "category": "staple",
    "emoji": "🍜",
    "minutes": 20,
    "servings": 2,
    "aliases": [
      "西红柿鸡蛋面",
      "汤面",
      "noodles"
    ],
    "ingredients": [
      {
        "key": "noodles",
        "amount": 160
      },
      {
        "key": "tomato",
        "amount": 300
      },
      {
        "key": "egg",
        "amount": 2
      },
      {
        "key": "greens",
        "amount": 150
      },
      {
        "key": "oil",
        "amount": 6
      },
      {
        "key": "salt",
        "amount": 1
      },
      {
        "key": "water",
        "amount": 800
      }
    ],
    "steps": [
      "番茄切块，小白菜洗净切段，鸡蛋打散；面条用量为干重。",
      "锅中热油炒番茄约 3 分钟至出汁，加入水烧开。",
      "加入面条，按包装时间煮熟；临近完成时放入青菜煮透。",
      "缓缓淋入蛋液，轻推并煮至蛋花完全凝固，最后加盐调味。"
    ],
    "tip": "面汤不必喝完；选低钠面条，主食、蛋白质和蔬菜一起搭配。"
  }
];
export const RECIPE_INGREDIENTS = {...HOME_INGREDIENTS, ...REGIONAL_INGREDIENTS};
export const RECIPES = [...HOME_RECIPES.map(recipe => ({...recipe, cuisine: 'home'})), ...REGIONAL_RECIPES];
const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase().trim();
export function searchRecipes(query = '', category = 'all', localize = value => value, cuisine = 'all') {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return RECIPES.filter(recipe => (category === 'all' || recipe.category === category) && (cuisine === 'all' || recipe.cuisine === cuisine) && (() => {
    const origin = CUISINES.find(item => item.id === recipe.cuisine);
    const labels = [recipe.name, origin.name, origin.region, ...recipe.aliases, ...recipe.ingredients.map(item => RECIPE_INGREDIENTS[item.key].name)];
    const haystack = normalize(labels.flatMap(label => [label, localize(label)]).join(' '));
    return terms.every(term => haystack.includes(term));
  })());
}
export function recipeIngredients(recipe, servings = 2) {
  if (![1, 2, 4].includes(servings)) throw new RangeError('Unsupported servings');
  return recipe.ingredients.map(item => ({...RECIPE_INGREDIENTS[item.key], amount: Math.round(item.amount * servings / recipe.servings * 100) / 100}));
}
