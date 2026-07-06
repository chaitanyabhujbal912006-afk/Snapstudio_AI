# AI Photo Editor for Creators — Step-by-Step Build Plan

This replaces the old "product photography only" plan. Same free stack
(Gradio + Hugging Face Spaces), same pipeline code we already built —
just reorganized into a multi-mode editor.

---

## The big picture, in plain terms

Think of the app as **one photo in, pick a mode, one result out.**

```
Upload photo
     |
     v
Pick a mode: [Auto-Enhance] [Background Swap] [Style Filter] [Remove Object]
     |
     v
See result, download it
```

We build these modes **one at a time**, in order of easiest-and-fastest to
hardest. Each step below is small enough to finish and test before moving
to the next.

---

## STEP 1 — Auto-Enhance (build this first)

**What it does:** Fix lighting, contrast, and sharpness automatically —
like tapping "auto" in a phone gallery app, but smarter.

**Why first:** No AI image-generation model needed at all — just classic
image processing (OpenCV/Pillow). This means:
- It's fast (1-2 seconds, even on free CPU)
- Nothing to download, no GPU wait
- You get a *working, deployed app* almost immediately, which matters for
  momentum

**What's actually happening under the hood:**
1. Auto white balance (fix color cast — e.g. photos that look too blue/yellow)
2. Auto contrast/exposure correction (histogram stretching)
3. Slight saturation boost (makes colors "pop" like Instagram filters do)
4. Sharpening pass

**How you'll know it works:** upload a slightly dull/flat photo, click
Auto-Enhance, and the result should look like a phone camera's "auto"
button was pressed — brighter, punchier, not obviously "AI-generated."

---

## STEP 2 — Background Swap (you already have this)

This is exactly the SnapStudio pipeline we built: segment the subject,
generate a new background, composite, add shadow. For creators this
becomes "replace my messy room background with a clean studio/outdoor
scene" instead of "replace product background."

**What changes from before:** the segmentation needs to handle *people*
well (portraits), not just products. `rembg`'s `u2net_human_seg` model
(a variant trained specifically on people) works better here than the
general model we used for products.

---

## STEP 3 — Style Filters (cartoon, anime, painting, etc.)

**What it does:** Transform a real photo into a stylized version —
anime, cartoon, oil painting, etc. This is what apps like Lensa/ Meitu
are known for.

**How it works:** Same Stable Diffusion pipeline as background swap, but
used differently — instead of only regenerating the background, we
regenerate the *whole image* while keeping enough of the original
structure (via `img2img` with a "strength" setting) that it still looks
like the same photo, just restyled.

**Key setting to understand:** a "strength" slider (0 to 1). Low strength
= subtle stylization, keeps the photo very close to original. High
strength = dramatic transformation, less resemblance to the original.
Give users this slider — it's the single most important control for this
feature.

---

## STEP 4 — Object Removal (build this last — hardest to get right)

**What it does:** User draws/taps over something they want gone (a
photobomber, a trash can, a wire in the background), and it gets filled
in convincingly.

**Why it's hardest:** unlike the other 3 modes, this needs the user to
*mark a region* (not just upload and click a button), which means more
UI work, and the AI inpainting has to blend seamlessly — this is the
feature most likely to look "off" if not tuned carefully. Building it
last means you already have a working app with 3 solid features before
you gamble time on the hardest one.

---

## Build order and what "done" looks like at each step

| Step | What you can show people when it's done |
|---|---|
| 1. Auto-Enhance | "Upload any photo, get an instantly better version" |
| 2. Background Swap | "Change your photo's background to anything" |
| 3. Style Filters | "Turn your selfie into anime/cartoon/painting style" |
| 4. Object Removal | "Erase anything unwanted from your photo" |

Each step is a fully working, shippable feature on its own — you don't
need all 4 to have something people can actually use and share.

---

## Speed reality check (important, and we discussed this already)

- **Auto-Enhance**: fast and free forever, no tradeoff.
- **Background Swap / Style Filters / Object Removal**: all need the
  diffusion model, which is slow on free CPU (1-2 min/image). For a
  creator-facing app, this wait is a real problem — competitors respond
  in seconds. When you're ready, moving just the "heavy" generation step
  to a pay-per-use GPU API (Replicate or fal.ai, fractions of a cent per
  image) is the practical fix — your ₹500 budget covers a lot of testing
  at that rate. We can stay 100% free for now to get everything working,
  then flip that one switch later.

---

## What we're building right now

Starting with **Step 1 (Auto-Enhance)**, added as a new tab in the
existing app, sitting alongside the Background Swap tab you already have
working. Nothing about your existing, working Background Swap code gets
removed — we're adding to it.
