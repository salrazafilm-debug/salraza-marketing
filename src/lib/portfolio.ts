export type PortfolioItem = {
  title: string;
  category: "Social media" | "Photography" | "Short-form video";
  image: string;
  width: number;
  height: number;
};

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: "NW Stadium concert lights",
    category: "Short-form video",
    image: "/portfolio/stadium-lights.jpg",
    width: 1350,
    height: 1800,
  },
  {
    title: "Festival stage pyro",
    category: "Short-form video",
    image: "/portfolio/festival-fireworks.jpg",
    width: 915,
    height: 518,
  },
  {
    title: "DMV Marksmen huddle",
    category: "Photography",
    image: "/portfolio/soccer-huddle.jpg",
    width: 1448,
    height: 1800,
  },
  {
    title: "Lady Marksmen jersey reveal",
    category: "Photography",
    image: "/portfolio/lady-marksmen-jerseys.jpg",
    width: 1800,
    height: 1334,
  },
  {
    title: "Marksmen jersey reveal",
    category: "Photography",
    image: "/portfolio/marksmen-boys-jerseys.jpg",
    width: 1448,
    height: 1800,
  },
  {
    title: "Catering event coverage",
    category: "Social media",
    image: "/portfolio/catering-event.jpg",
    width: 1015,
    height: 1800,
  },
  {
    title: "Crew on site",
    category: "Photography",
    image: "/portfolio/crew-team-photo.jpg",
    width: 1800,
    height: 1196,
  },
  {
    title: "Good sportsmanship",
    category: "Photography",
    image: "/portfolio/marksmen-handshake.jpg",
    width: 1800,
    height: 1197,
  },
  {
    title: "Volleyball game day",
    category: "Photography",
    image: "/portfolio/volleyball-game.jpg",
    width: 1200,
    height: 1800,
  },
];
