import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero-bg relative text-white">
      <div className="bg-[url('/hero.jpg')]">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">Live Football Scores & More</h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Get real-time scores, match schedules, results, rankings, odds and AI-powered predictions for all major football leagues worldwide.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/livescore" className="bg-primary px-5 py-2 rounded font-semibold hover:bg-primary-dark">
              View Live Scores
            </Link>
            <Link href="/prediction" className="border border-white px-5 py-2 rounded font-semibold hover:bg-white/10">
              Get Predictions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}