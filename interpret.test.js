const { interpret } = require("./interpret");  // Путь к твоему файлу с кодом

jest.mock("fs");  // Мокаем файловую систему для эмуляции чтения и записи файлов

describe("Тесты интерпретатора бинарных файлов", () => {
    const mockBinaryFile = "mockProgram.bin";
    const mockOutputFile = "mockOutput.yaml";
    const memoryRange = 20;  // Убедимся, что передаем корректный размер памяти

    beforeEach(() => {
        // Очищаем моки перед каждым тестом
        fs.readFileSync.mockClear();
        fs.writeFileSync.mockClear();
    });

    test("должен корректно интерпретировать бинарный файл и записать результат в выходной файл", () => {
        // Эмулируем бинарный файл с кодами операций
        const mockBinaryData = Buffer.from([0xE1, 0x00, 0x00, 0x00, 0x00, 0xD1, 0x00, 0x00, 0x00, 0x00]);
        
        // Мокаем поведение fs
        fs.readFileSync.mockReturnValue(mockBinaryData);
        fs.writeFileSync.mockImplementation((file, data) => {
            // Проверяем, что результат записывается в правильный файл
            expect(file).toBe(mockOutputFile);
            // Проверяем, что результат в файле соответствует ожиданиям
            expect(data).toBe(`{"memory":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`);
        });

        // Вызываем интерпретатор
        interpret(mockBinaryFile, mockOutputFile, memoryRange);

        // Проверяем, что fs.readFileSync был вызван с правильным параметром
        expect(fs.readFileSync).toHaveBeenCalledWith(mockBinaryFile);

        // Проверяем, что fs.writeFileSync был вызван
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test("должен выбросить ошибку при неправильном размере памяти", () => {
        const invalidMemoryRange = -5;  // Некорректное значение для памяти

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        try {
            interpret(mockBinaryFile, mockOutputFile, invalidMemoryRange);
        } catch (err) {
            expect(err.message).toBe("Размер памяти должен быть положительным числом.");
        }

        consoleErrorSpy.mockRestore();
    });

    test("должен обработать ошибку при чтении бинарного файла", () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error("Ошибка при чтении файла.");
        });

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        try {
            interpret(mockBinaryFile, mockOutputFile, memoryRange);
        } catch (err) {
            expect(err.message).toBe("Ошибка при чтении бинарного файла: Ошибка при чтении файла.");
        }

        consoleErrorSpy.mockRestore();
    });

    test("должен обработать неизвестные команды в бинарном файле", () => {
        const mockBinaryDataWithUnknownOpcode = Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x00]);
        fs.readFileSync.mockReturnValue(mockBinaryDataWithUnknownOpcode);

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        interpret(mockBinaryFile, mockOutputFile, memoryRange);

        // Проверяем, что была вызвана ошибка для неизвестной команды
        expect(consoleErrorSpy).toHaveBeenCalledWith("Неизвестная команда: 255");

        consoleErrorSpy.mockRestore();
    });

    test("должен корректно обрабатывать команду LOAD_CONST", () => {
        const mockBinaryData = Buffer.from([0xE1, 0x00, 0x00, 0x00, 0x01]);  // Загрузка 1 в аккумулятор

        // Мокаем поведение fs
        fs.readFileSync.mockReturnValue(mockBinaryData);
        fs.writeFileSync.mockImplementation((file, data) => {
            // Проверяем, что результат записывается в правильный файл
            expect(file).toBe(mockOutputFile);
            // Проверяем, что результат в файле соответствует ожиданиям
            expect(data).toBe(`{"memory":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`);
        });

        // Вызываем интерпретатор
        interpret(mockBinaryFile, mockOutputFile, memoryRange);

        expect(fs.readFileSync).toHaveBeenCalledWith(mockBinaryFile);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test("должен корректно обрабатывать команду READ_MEM", () => {
        const mockBinaryData = Buffer.from([0xD1, 0x00, 0x00, 0x00, 0x00]);  // Чтение из памяти по адресу 0

        // Мокаем поведение fs
        fs.readFileSync.mockReturnValue(mockBinaryData);

        // Ожидаемый результат с памятью, где все значения равны 0
        const expectedMemory = new Array(memoryRange).fill(0);
        const expectedResult = { memory: expectedMemory };

        fs.writeFileSync.mockImplementation((file, data) => {
            expect(file).toBe(mockOutputFile);
            expect(data).toBe(JSON.stringify(expectedResult, null, 2));
        });

        // Вызываем интерпретатор
        interpret(mockBinaryFile, mockOutputFile, memoryRange);

        expect(fs.readFileSync).toHaveBeenCalledWith(mockBinaryFile);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });
});
