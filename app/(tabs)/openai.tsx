const restrictions = {
    Eggs: false,
    Milk: true,
    Peanuts: true,
    Almonds: false,
  };
  
  const foodFacts = "This food contains milk and traces of peanuts.";
  
  // Generate the prompt
  const generatePrompt = (restrictions, foodFacts) => {
    const restrictedItems = Object.keys(restrictions)
      .filter((key) => restrictions[key]) // Only include restricted items (true)
      .join(", ");
  
    return `Here is a list of restricted items: ${restrictedItems}.
  Food facts: "${foodFacts}".
  Determine if any of the restricted items are mentioned in the food facts.`;
  };
  
  const new_prompt = generatePrompt(restrictions, foodFacts);
  
  const openAIRequest = async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer YOUR_API_KEY`,
        },
        body: JSON.stringify({
          model: "text-davinci-003",
          prompt: new_prompt,
          max_tokens: 100,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API Response:", data.choices[0].text.trim());
    } catch (error) {
      console.error("Error during API request:", error);
    }
  };
  
  openAIRequest();