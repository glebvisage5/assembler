// Подключаем модуль для работы с файловой системой
const fs = require("fs");

// Функция для ассемблирования программы
function assemble(inputFile, binaryFile, logFile) {
    // Определяем инструкции и их коды операций
    const instructions = {
        "LOAD_CONST": 0xE1,  // Загрузка константы
        "READ_MEM": 0xD1,    // Чтение значения из памяти
        "WRITE_MEM": 0x12,   // Запись значения в память
        "BIT_REVERSE": 0x3A, // Побитовая реверсия
    };

    // Читаем исходный файл и разбиваем его на строки
    const sourceCode = fs.readFileSync(inputFile, "utf8").split("\n");

    // Создаем массивы для бинарного кода и лога
    const binary = [];
    const log = [];

    // Проходимся по каждой строке исходного кода
    sourceCode.forEach((line, index) => {
        if (line.trim() === "") return; // Пропуск пустых строк
    
        const parts = line.trim().split(" ");
        const command = parts[0];
        const operand = parseInt(parts[1], 10) || 0;
    
        let opcode = instructions[command];
        if (opcode === undefined) {
            throw new Error(`Неизвестная команда в строке ${index + 1}: ${command}`);
        }
        
        const operandBytes = Buffer.alloc(4);
        operandBytes.writeUInt32LE(operand);
    
        binary.push(opcode, ...operandBytes);
        log.push(`строка${index + 1}: команда=${command}, операнд=${operand}`);
    });

    // Записываем бинарный файл
    fs.writeFileSync(binaryFile, Buffer.from(binary));

    // Записываем лог файл
    fs.writeFileSync(logFile, log.join("\n"));

    // Сообщаем об успешной сборке
    console.log("Ассемблирование завершено.");
}

// Проверка аргументов командной строки (оставляем для реального выполнения)
if (require.main === module) {
    const args = process.argv.slice(2); // Получаем аргументы (исключаем имя файла скрипта)

    if (args.length !== 3) {
        console.error("Неверное количество аргументов. Ожидается: node assemble.js inputFile binaryFile logFile");
        process.exit(1);
    }

    // 1. Входной файл 2. Бинарный файл 3. Файл логов
    const [inputFile, binaryFile, logFile] = args;

    assemble(inputFile, binaryFile, logFile);
}

module.exports = { assemble };
