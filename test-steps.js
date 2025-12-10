const CSVProcessor = require('./lib/csv-processor');

const testOutput = `步骤 1: Observation of Tool \`poster_design_guidance\`, output is:
Here presents the design suggestions: 
 ## 设计要点

1. 整体风格 
 - 基调：清新果园·原生态 
 - 气质：专业、精致、带有高端感的"轻奢农鲜"氛围 
 - 美学方向：Organic Soft＋动态布局

2. 画面比例 
 - 竖版 2:3 比例（抖音商品主图常用，利于直播间信息呈现与转化）

3. 主元素使用 
 - 提供的"开箱图"置于画面中心，保持 45° 仰拍倾斜，模拟主播举盒展示；不得裁剪变形 
 - 提供的"外包装图"缩放至右下角，制造品牌背书与溯源可信度 
 - 两张图均保持原貌，仅做大小与位置编排

步骤 2: Observation of Tool \`Navo_image_generate\`, output is:
Navo has generated the image [猕猴桃产品上架图-清新果园风格]: https://liblibai-online.liblib.cloud/agent_images/2c5a04a1-3145-4011-a040-9a991b1c3fd4.png
步骤 3: Observation of Tool \`terminate\`, output is:
The interaction has been completed with status: success`;

const processor = new CSVProcessor();
const result = processor.parseAISteps(testOutput);

console.log('=== AI步骤解析测试结果 ===');
console.log('步骤数量:', result.steps.length);
console.log('是否有步骤:', result.hasSteps);
console.log('总结:', result.summary);

result.steps.forEach((step, index) => {
    console.log(`\n--- 步骤 ${step.stepNumber} ---`);
    console.log('工具:', step.tool);
    console.log('简化内容:', step.content);
    console.log('结构化输出:', step.structuredOutput ? `类型: ${step.structuredOutput.type}` : '无');
});