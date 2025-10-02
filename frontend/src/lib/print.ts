export const printElementById = async (elementId: string): Promise<void> => {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Ensure the element is in the DOM and styles have applied
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

  await new Promise<void>((resolve) => {
    const handler = () => {
      window.removeEventListener("afterprint", handler);
      resolve();
    };
    window.addEventListener("afterprint", handler);

    // Trigger print
    window.print();
  });
};
