export type PortfolioItem = {
  title: string;
  category: "Social media" | "Photography" | "Short-form video";
  image: string;
};

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: "NW Stadium concert lights",
    category: "Short-form video",
    image: "/portfolio/stadium-lights.jpg",
  },
  {
    title: "Festival stage pyro",
    category: "Short-form video",
    image: "/portfolio/festival-fireworks.jpg",
  },
  {
    title: "DMV Marksmen huddle",
    category: "Photography",
    image: "/portfolio/soccer-huddle.jpg",
  },
  {
    title: "Lady Marksmen jersey reveal",
    category: "Photography",
    image: "/portfolio/lady-marksmen-jerseys.jpg",
  },
  {
    title: "Marksmen jersey reveal",
    category: "Photography",
    image: "/portfolio/marksmen-boys-jerseys.jpg",
  },
  {
    title: "Catering event coverage",
    category: "Social media",
    image: "/portfolio/catering-event.jpg",
  },
  {
    title: "Crew on site",
    category: "Photography",
    image: "/portfolio/crew-team-photo.jpg",
  },
  {
    title: "Good sportsmanship",
    category: "Photography",
    image: "/portfolio/marksmen-handshake.jpg",
  },
  {
    title: "Volleyball game day",
    category: "Photography",
    image: "/portfolio/volleyball-game.jpg",
  },
];
