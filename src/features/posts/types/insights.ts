/** One bar of the hourly views chart. The series is dense: zero hours included. */
export interface InsightsHourlyView {
  bucketStart: string;
  /** Whole hours since publication; `1` is the first full hour. */
  hour: number;
  views: number;
}

/** `countryCode` is `XX` for the "other" bucket and for unknown traffic. */
export interface InsightsCountryView {
  countryCode: string;
  views: number;
  percentage: number;
}

export interface InsightsReach {
  views: number;
  viewsLast24h: number;
  hoursTracked: number;
}

export interface InsightsEngagement {
  upvotes: number;
  downvotes: number;
  /** Null when nobody has voted, which is not the same as a 0% ratio. */
  upvoteRatio: number | null;
  comments: number;
  shares: number;
  reposts: number;
  awards: number;
}

/** Mirrors `PostInsightsResponseDto`. Author and community mods only. */
export interface PostInsights {
  postId: number;
  title: string;
  communityName: string;
  authorId: number;
  publishedAt: string;
  reach: InsightsReach;
  hourlyViews: InsightsHourlyView[];
  countries: {
    top: InsightsCountryView[];
    other: InsightsCountryView;
  };
  engagement: InsightsEngagement;
}

/** Result of the view beacon: `counted` is false when deduplicated. */
export interface PostViewBeacon {
  postId: number;
  counted: boolean;
}
