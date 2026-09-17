document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bmiForm");
  const unitsSelect = document.getElementById("units");
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const weightLabel = document.getElementById("weightLabel");
  const heightLabel = document.getElementById("heightLabel");
  const weightError = document.getElementById("weightError");
  const heightError = document.getElementById("heightError");
  const resultBox = document.getElementById("bmiResult");
  const bmiValue = document.getElementById("bmiValue");
  const bmiCategory = document.getElementById("bmiCategory");

  unitsSelect.addEventListener("change", () => {
    const metric = unitsSelect.value === "metric";
    weightLabel.textContent = metric ? "Weight (kg)" : "Weight (lb)";
    heightLabel.textContent = metric ? "Height (cm)" : "Height (in)";
    resultBox.classList.remove("show");
  });

  function categoryFor(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  function validate() {
    let valid = true;
    weightError.textContent = "";
    heightError.textContent = "";

    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);

    if (!weightInput.value || isNaN(weight) || weight <= 0) {
      weightError.textContent = "Enter a weight greater than 0.";
      valid = false;
    }
    if (!heightInput.value || isNaN(height) || height <= 0) {
      heightError.textContent = "Enter a height greater than 0.";
      valid = false;
    }
    return valid;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      resultBox.classList.remove("show");
      return;
    }

    let weight = parseFloat(weightInput.value);
    let height = parseFloat(heightInput.value);

    if (unitsSelect.value === "imperial") {
      weight = weight * 0.453592;
      height = height * 0.0254;
    } else {
      height = height / 100;
    }

    const bmi = weight / (height * height);
    bmiValue.textContent = bmi.toFixed(1);
    bmiCategory.textContent = `Category: ${categoryFor(bmi)}`;
    resultBox.classList.add("show");
  });
});
