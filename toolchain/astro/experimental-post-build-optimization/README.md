# Experimental Post Build Optimization Astro Integration

My goal is to optimize the HTML/CSS/JS as much as possible, in an attempt to reduce the assets size. This post build optimization removes unused custom properties from CSS, inlines images from the InlineImage astro component, renames classes and custom properties to short names, minifies the HTML, and sets up CSP.

I'd like to acknowledge the usage of a generative-AI tool to help manipulate ASTs, and refactor the code of this Astro Integration. I had limited time to experiment with a couple of ideas.

This whole implementation is really experimental, and might break builds in the future.
