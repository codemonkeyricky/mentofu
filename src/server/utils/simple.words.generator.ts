export function generateSimpleWords(count: number = 10) {
  // List of simple words with hints for kids
  const wordsWithHints = [
    { word: "cat", hint: "A small pet that says meow" },
    { word: "dog", hint: "A loyal pet that says woof" },
    { word: "sun", hint: "Shines bright in the sky" },
    { word: "hat", hint: "Worn on your head" },
    { word: "car", hint: "Moves on roads" },
    { word: "book", hint: "Read for fun" },
    { word: "fish", hint: "Lives in water" },
    { word: "bird", hint: "Flies in the sky" },
    { word: "ball", hint: "Bounces when thrown" },
    { word: "tree", hint: "Grows tall with leaves" },
    { word: "cake", hint: "Sweet treat for birthdays" },
    { word: "moon", hint: "Nighttime light in the sky" },
    { word: "star", hint: "Twinkles in the night sky" },
    { word: "bed", hint: "Sleep on it at night" },
    { word: "cup", hint: "Drink from it" },
    { word: "box", hint: "Contains things inside" },
    { word: "egg", hint: "Laid by chickens" },
    { word: "ice", hint: "Cold frozen water" },
    { word: "fire", hint: "Hot and burns" },
    { word: "wind", hint: "Moves leaves around" }
  ];

  // Shuffle array to randomize words
  const shuffled = [...wordsWithHints].sort(() => 0.5 - Math.random());

  // Take the requested number of words
  const selectedWords = shuffled.slice(0, count);

  // Add letter count to each word
  return selectedWords.map(wordObj => ({
    ...wordObj,
    letterCount: wordObj.word.length
  }));
}