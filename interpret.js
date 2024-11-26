// Подключаем модуль для работы с файловой системой
const fs = require("fs");

// Функция интерпретатора для выполнения бинарного файла
function interpret(binaryFile, outputFile, memoryRange) {
    // Считываем бинарный файл
    const binary = fs.readFileSync(binaryFile);

    // Инициализируем память заданного размера (заполнена нулями)
    const memory = new Array(memoryRange).fill(0);

    // Аккумулятор (регистр для хранения текущего значения)
    let accumulator = 0;

    // Проходим по бинарному файлу блоками по 5 байт
    for (let i = 0; i < binary.length; i += 5) {
        const opcode = binary[i]; // Первый байт — код операции
        const operand = binary.readUInt32LE(i + 1); // Следующие 4 байта — операнд

        // Выполняем команды в зависимости от кода операции
        if (opcode === 0xE1) {
            // Команда LOAD_CONST: загрузить константу в аккумулятор
            accumulator = operand;
        } else if (opcode === 0xD1) {
            // Команда READ_MEM: прочитать значение из памяти по адресу (операнд)
            accumulator = memory[operand] || 0;
        } else if (opcode === 0x12) {
            // Команда WRITE_MEM: записать значение аккумулятора в память по адресу (операнд)
            memory[operand] = accumulator;
        } else if (opcode === 0x3A) {
            // Команда BIT_REVERSE: выполнить побитовую реверсию значения аккумулятора
            accumulator = bitReverse(accumulator);
        } else {
            // Если команда неизвестна, выводим ошибку
            console.error(`Неизвестная команда: ${opcode}`);
            return;
        }
    }

    // Создаем объект с результатами выполнения
    const result = { memory: memory.slice(0, memoryRange) };

    // Записываем результат в выходной файл
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    // Сообщаем об успешном завершении интерпретации
    console.log("Интерпретация завершена.");
}

// Функция для побитовой реверсии числа
function bitReverse(num) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        // Сдвигаем результат влево и добавляем младший бит числа
        result = (result << 1) | (num & 1);
        num >>= 1; // Сдвигаем число вправо
    }
    return result >>> 0; // Преобразуем в беззнаковое 32-битное число
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2); // Получаем аргументы (исключаем имя файла скрипта)

if (args.length !== 3) {
    console.error("Неверное количество аргументов. Ожидается: node interpret.js binaryFile outputFile memoryRange");
}

// 1. Входной бинарный файл 2. Выходной файл 3. Размер памяти
const [binaryFile, outputFile, memoryRange] = args;
const memoryRangeInt = parseInt(memoryRange, 10);

if (isNaN(memoryRangeInt) || memoryRangeInt <= 0) {
    console.error("Размер памяти должен быть положительным числом.");
}

interpret(binaryFile, outputFile, memoryRangeInt);

module.exports = { interpret };