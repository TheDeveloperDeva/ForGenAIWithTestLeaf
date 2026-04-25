function validate(text: string) {
  return text.length > 50000 ? "Good test cases" : "Too short";
}

const sample = "Login test case example";

console.log(validate(sample));