# TimerUX

**TimerUX** is an educational web project that demonstrates how user experience design affects otherwise identical web applications.

The project uses timers as small, focused examples. Every timer is implemented in two versions:

* a **good UX** version, designed around clear feedback, accessibility, and low friction;
* a **bad UX** version, intentionally designed to illustrate common usability problems.

Both versions provide the same functional behavior. The difference is not what users can do, but how easy, clear, and pleasant the interaction is.

## Live demo

The project is currently deployed on Render:

* [Main page](https://timerux-demonstration.onrender.com/)
* [Good timer](https://timerux-demonstration.onrender.com/good.html)
* [Bad timer](https://timerux-demonstration.onrender.com/bad.html)

> The hosting setup and domain may change in the future.

## Current status

TimerUX is in the early stages of development.

At the moment, it contains one generic timer in two versions:

* Good UX timer
* Bad UX timer

## Project goals

TimerUX is intended to become a collection of interactive UX comparisons. Each comparison will focus on one specific aspect of web application design while keeping the underlying functionality equivalent.

Planned improvements, in approximate priority order:

1. Add timer pairs demonstrating:

   * customization;
   * onboarding and user-friendly tutorials;
   * perceived backend communication speed;
   * error prevention and error recovery.
2. Redesign the main page.
3. Add support for user-defined timers.
4. Expand the project into a larger interactive web application or learning course about UX.

## Tech stack

The current version is built with:

* HTML
* CSS
* JavaScript

No build step is required.

## Run locally

Clone the repository:

```bash
git clone https://github.com/CareinZK/timerUX-demonstration.git
cd timerUX-demonstration
```

Then open `index.html` in a browser.

For a more reliable local-development experience, run the project through a local web server. For example, with Visual Studio Code and the Live Server extension, open `index.html` and choose **Open with Live Server**.

## Project structure

```text
timerUX-demonstration/
├── index.html       # Main page
├── good.html        # Good UX timer
├── bad.html         # Bad UX timer
├── app.js           # Shared timer logic
├── bad.js           # Logic specific to the bad UX timer
├── styles.css       # Shared styles
├── bad.css          # Styles specific to the bad UX timer
└── alarm-sound.mp3  # Timer alarm sound
```

## Contributing

Contributions, feedback, and UX observations are welcome.

You can help by:

* opening an issue to report a bug or suggest an improvement;
* proposing a new UX comparison;
* improving accessibility, design, or documentation;
* submitting a pull request.

Before submitting a pull request, please keep the central idea of the project intact: paired timer versions should have equivalent functionality while differing meaningfully in user experience.

## Reporting problems

To report a bug or usability issue, please open a GitHub issue and include:

* the page or timer version where the problem occurs;
* steps to reproduce it;
* expected behavior;
* actual behavior;
* screenshots or recordings, if useful.

## License

A license has not been added yet.
