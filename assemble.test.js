// assemble.test.js

const fs = require('fs');
const { assemble } = require('./assemble'); // Импортируем функцию для тестирования

jest.mock('fs'); // Мокаем все функции модуля fs

describe('Функция assemble', () => {
    const mockSourceCode = 'LOAD_CONST 42\nREAD_MEM 10\nWRITE_MEM 5\nBIT_REVERSE 0\n';
    const mockInputFile = 'input.asm';
    const mockBinaryFile = 'output.bin';
    const mockLogFile = 'output.log';

    beforeEach(() => {
        // Мокаем функцию fs.readFileSync так, чтобы она возвращала строку
        fs.readFileSync.mockClear();
        fs.writeFileSync.mockClear();

        // Мокаем возвращаемое значение readFileSync для input.asm
        fs.readFileSync.mockReturnValue(mockSourceCode);
    });

    it('чтение входного файла и генерация бинарного и лог-файлов', () => {
        // Симулируем аргументы командной строки, как если бы был вызов assemble.js
        process.argv = ['node', 'assemble.js', mockInputFile, mockBinaryFile, mockLogFile];

        // Запускаем ассемблер
        assemble(mockInputFile, mockBinaryFile, mockLogFile);

        // Проверяем, что readFileSync был вызван с правильным аргументом
        expect(fs.readFileSync).toHaveBeenCalledWith(mockInputFile, 'utf8');

        // Проверяем, что writeFileSync был вызван с правильными аргументами для бинарного файла
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockBinaryFile,
            expect.any(Buffer)
        );

        // Проверяем, что writeFileSync был вызван с правильными аргументами для лог-файла
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockLogFile,
            expect.stringContaining('строка1: команда=LOAD_CONST, операнд=42')
        );
    });

    it('обрабатка неизвестных команд и выбрасос ошибок', () => {
        // Мокаем исходный код с неизвестной командой
        const invalidSourceCode = 'UNKNOWN_CMD 100\n';
        fs.readFileSync.mockReturnValue(invalidSourceCode);

        // Симулируем аргументы командной строки, как если бы был вызов assemble.js
        process.argv = ['node', 'assemble.js', mockInputFile, mockBinaryFile, mockLogFile];

        // Проверяем, что при попытке ассемблирования с неизвестной командой будет выброшена ошибка
        expect(() => assemble(mockInputFile, mockBinaryFile, mockLogFile)).toThrowError(
            'Неизвестная команда в строке 1: UNKNOWN_CMD'
        );
    });

    it('обрабатка пустых строк в исходном коде', () => {
        // Мокаем исходный код с пустыми строками
        const sourceWithEmptyLines = 'LOAD_CONST 42\n\nREAD_MEM 10\n\nWRITE_MEM 5\n';
        fs.readFileSync.mockReturnValue(sourceWithEmptyLines);

        // Симулируем аргументы командной строки, как если бы был вызов assemble.js
        process.argv = ['node', 'assemble.js', mockInputFile, mockBinaryFile, mockLogFile];

        // Запускаем ассемблер
        assemble(mockInputFile, mockBinaryFile, mockLogFile);

        // Проверяем, что writeFileSync был вызван с правильными аргументами для бинарного файла
        expect(fs.writeFileSync).toHaveBeenCalledWith(mockBinaryFile, expect.any(Buffer));
        
        // Проверяем, что в логе не содержатся пустые строки
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockLogFile,
            expect.not.stringContaining('\n\n')
        );
    });

    it('обработка недопустимых значений операндов', () => {
        // Мокаем исходный код с невалидным операндом
        const invalidSourceCode = 'LOAD_CONST NaN\n';
        fs.readFileSync.mockReturnValue(invalidSourceCode);

        // Симулируем аргументы командной строки, как если бы был вызов assemble.js
        process.argv = ['node', 'assemble.js', mockInputFile, mockBinaryFile, mockLogFile];

        // Запускаем ассемблер и проверяем, что ошибки не возникнет, а операнд будет заменен на 0
        assemble(mockInputFile, mockBinaryFile, mockLogFile);

        // Проверяем, что в бинарном файле будет записан операнд 0
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockBinaryFile,
            expect.any(Buffer)
        );
    });
});
