function removeSpaces(str) {
    return str.replace(/\s/g, '');
}

// Ví dụ sử dụng
const input = "wdwv sfw";
const output = removeSpaces(input);
console.log(output); // Kết quả: "wdwvsfw"