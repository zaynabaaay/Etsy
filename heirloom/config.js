/* ==========================================================================
   HEIRLOOM — Cinematic Wedding Invitation
   ==========================================================================

   ★ THIS IS THE ONLY FILE YOU NEED TO EDIT ★

   How it works:
     1. Change the text between the quotes " " below.
     2. Save this file.
     3. Open index.html in your browser to preview.
     4. When you're happy, follow the README to publish it free online.

   Tips:
     • Keep the quotes " " and commas , exactly where they are.
     • To turn a section OFF, change  true  to  false  (no quotes).
     • Lines starting with // are notes for you — they change nothing.

   ========================================================================== */

window.HEIRLOOM_CONFIG = {

  /* --------------------------------------------------------------------
     1. THE COUPLE
     -------------------------------------------------------------------- */
  couple: {
    firstName: "Olivia",          // Appears first on the invitation
    secondName: "Alexander",
    // Initials for the wax seal + monogram (usually one letter each)
    firstInitial: "O",
    secondInitial: "A",
  },

  /* --------------------------------------------------------------------
     2. THE DAY
     -------------------------------------------------------------------- */
  wedding: {
    // Date & start time, used by the countdown and "Add to Calendar".
    // Format: year, month, day, hour (24h), minute — keep the numbers order.
    year: 2026, month: 8, day: 20, hour: 17, minute: 0,

    // How long the whole celebration lasts, in hours (for the calendar entry)
    durationHours: 7,

    // The date as you want guests to READ it
    displayDate: "Thursday, the twentieth of August",
    displayYear: "two thousand twenty-six",
    displayTime: "five o'clock in the evening",

    // Short date for the embossed card in the intro (day / month / year)
    shortDate: { day: "20", month: "08", year: "26" },

    // City line shown under the names
    cityLine: "Charleston, South Carolina",

    // Title used for the guest's calendar entry
    calendarTitle: "Olivia & Alexander's Wedding",
    calendarLocation: "Magnolia Grove Estate, 1180 Ashley River Road, Charleston, SC",
  },

  /* --------------------------------------------------------------------
     3. WORDING (the small fixed lines around the site)
     -------------------------------------------------------------------- */
  wording: {
    envelopeLine: "You are invited",             // printed on the envelope
    tapHint: "Touch the seal to open",           // hint under the envelope
    inviteLine: "Together with their families",  // above the names
    inviteLine2: "joyfully invite you to celebrate their marriage",
    scrollHint: "scroll",
    countdownTitle: "Counting down the days",
    onTheDay: "Today is the day",                // countdown on the wedding day
    afterTheDay: "Happily married",              // countdown after the wedding
    storyTitle: "Our Story",
    venueTitle: "Where & When",
    scheduleTitle: "The Day's Events",
    detailsTitle: "A Few Details",
    rsvpTitle: "Will we see you there?",
    closingWords: "We can't wait to share this day with you.",
    replayIntro: "Replay the opening",
  },

  /* --------------------------------------------------------------------
     4. OUR STORY  (2–3 short chapters reads best)
        To add a photo to a chapter: put the image file in the assets
        folder and write its path, e.g.  photo: "assets/how-we-met.jpg"
        No photo? Leave it as  photo: ""
     -------------------------------------------------------------------- */
  story: [
    {
      tag: "October 2019",
      title: "How we met",
      text: "A borrowed umbrella outside a bookshop, one shared walk to the corner, and a conversation neither of us wanted to end.",
      photo: "",
    },
    {
      tag: "June 2021",
      title: "The adventure",
      text: "Two apartments became one. A rescue dog named Juniper approved of Alexander almost immediately, and of Olivia's cooking even sooner.",
      photo: "",
    },
    {
      tag: "December 2025",
      title: "The proposal",
      text: "Under the first snowfall of the year, on the same street corner where it all began — she said yes before he finished asking.",
      photo: "",
    },
  ],

  /* --------------------------------------------------------------------
     5. VENUES
        One place for everything? Just delete the second block
        (from the { after the comma to the matching }).
     -------------------------------------------------------------------- */
  venues: [
    {
      label: "The Ceremony",
      name: "Magnolia Grove Estate",
      address: "1180 Ashley River Road, Charleston, SC",
      time: "5:00 PM",
      note: "The garden lawn, beneath the oaks",
      // Paste any Google Maps link for the "Directions" button:
      mapLink: "https://maps.google.com/?q=Magnolia+Grove+Estate+Charleston+SC",
    },
    {
      label: "The Reception",
      name: "The Orangery Hall",
      address: "1180 Ashley River Road, Charleston, SC",
      time: "7:00 PM",
      note: "Dinner, toasts & dancing to follow",
      mapLink: "https://maps.google.com/?q=Magnolia+Grove+Estate+Charleston+SC",
    },
  ],

  /* --------------------------------------------------------------------
     6. SCHEDULE  (add or remove lines freely — keep the format)
        icon options: "rings" · "glass" · "dinner" · "cake" · "music" · "sparkle" · ""
     -------------------------------------------------------------------- */
  schedule: [
    { time: "4:30 PM",  title: "Guests arrive",     note: "Lemonade & lawn games on the terrace", icon: "sparkle" },
    { time: "5:00 PM",  title: "The ceremony",      note: "Garden lawn — seats for everyone",     icon: "rings"   },
    { time: "6:00 PM",  title: "Cocktail hour",     note: "Champagne & hors d'oeuvres",           icon: "glass"   },
    { time: "7:00 PM",  title: "Dinner is served",  note: "The Orangery Hall",                    icon: "dinner"  },
    { time: "9:00 PM",  title: "Cake & first dance", note: "Bring your dancing shoes",            icon: "cake"    },
    { time: "11:30 PM", title: "Last dance",        note: "Sparkler send-off on the drive",       icon: "music"   },
  ],

  /* --------------------------------------------------------------------
     7. THE DETAIL CARDS
     -------------------------------------------------------------------- */
  dressCode: {
    title: "Dress Code",
    text: "Garden formal — suits and long or midi dresses in soft, warm tones. Ladies, a low heel is kind to the lawn.",
    // Little silk-swatch dots shown under the text (any CSS colors)
    swatches: ["#F3EBDD", "#D9C6AC", "#8E5D4E", "#6B2E2A"],
  },

  gifts: {
    title: "Gifts",
    text: "Your presence is truly the greatest gift. Should you wish to give more, a small contribution to our honeymoon adventure would be warmly appreciated.",
  },

  accommodation: {
    title: "Staying Over",
    text: "A block of rooms is reserved at The Ashley Inn (10 minutes away) under “Olivia & Alexander” until July 20th. Mention the wedding when booking.",
  },

  /* --------------------------------------------------------------------
     8. RSVP
        Paste the link guests should use to reply — a Google Form,
        an email address ("mailto:you@example.com"), or a WhatsApp link
        ("https://wa.me/15551234567"). The README shows how to make each.
     -------------------------------------------------------------------- */
  rsvp: {
    deadline: "Kindly reply by the 20th of July",
    buttonText: "Reply to our invitation",
    link: "https://forms.google.com/your-form-link-here",
    note: "We've saved you a seat — tell us if you can fill it.",
  },

  /* --------------------------------------------------------------------
     9. MUSIC & SOUND
        For music: put an .mp3 in the assets folder and write its path,
        e.g.  file: "assets/our-song.mp3"  — it starts softly when the
        guest opens the seal, with a mute button on screen.
     -------------------------------------------------------------------- */
  music: {
    file: "",        // "" = no background music
    volume: 0.4,     // 0.0 (silent) to 1.0 (full)
  },

  /* --------------------------------------------------------------------
     10. TURN SECTIONS ON / OFF   ( true = show · false = hide )
     -------------------------------------------------------------------- */
  sections: {
    countdown: true,
    story: true,
    venues: true,
    schedule: true,
    dressCode: true,
    gifts: true,
    accommodation: true,
    rsvp: true,
  },

  /* --------------------------------------------------------------------
     11. ATMOSPHERE   ( true = on · false = off )
     -------------------------------------------------------------------- */
  effects: {
    petals: true,         // softly drifting petals
    soundEffects: true,   // wax-seal crack & paper sounds in the opening
    rememberVisit: true,  // returning guests skip straight to the invitation
  },

};
