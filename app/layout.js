import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import TravelBot from "./components/TravelBot";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  title: "Travel Threads — India Travel Planner | Discover Incredible Destinations",
  description:
    "Plan your perfect Indian adventure with curated itineraries for Manali, Goa, Meghalaya, Jaipur, Ladakh and more. Explore destinations, plan day-by-day trips, and calculate expenses — all in one place.",
  keywords: "India travel, travel planner, itinerary, Manali, Goa, Meghalaya, Ladakh, Jaipur, Varanasi, Rishikesh, expense calculator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        {children}
        <TravelBot />
      </body>
    </html>
  );
}
