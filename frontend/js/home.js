const TESTIMONIALS = [
  { name: "Zara K.", rating: 5, quote: "The Power Circuit program pushed me further than any gym I've trained at before. Amir actually watches your form." },
  { name: "Danish R.", rating: 5, quote: "Booked a trainer session in two minutes and got a reminder email. Way less friction than calling the front desk." },
  { name: "Mahnoor S.", rating: 4, quote: "Sunrise Flow with Sara is the best way I've found to start a training day. Small class sizes, real attention." },
];

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("testimonialGrid");
  if (grid) {
    grid.innerHTML = TESTIMONIALS.map(testimonialCard).join("");
  }
});
