# Graidients
###### Make patterns with AI https://magnogen.net/graidients

This is the source code for a section of my website.
You're welcome to snoop around to see how it works, maybe even make a pull request!
(I've been wanting to add an interesting UI!)

### How it works
Click on the image, press the `Enter` key, or refresh the page to regenerate a random Neural Network and start the drawing process.

The algorithm works by feeding the X and Y coordinate into the neural network, and using the 3 of the 5 outputs for the red, green and blue value at that pixel.
The other 2 values come into play when you enable domain warping, that just offsets the input coordinate by that amount and then regenerates at _that_ position (hence why it takes slightly longer).

Different kinds of Networks with different activation functions produce different aesthetics.

### Plans for the future
Mostly UI stuff, you don't have any control over things otherwise.
- [x] A way to redraw the image (click it? a keybind?) 
  
  Click the image, or press the `Enter` Key
- [ ] Network customisation
  - [ ] Number of hidden layers, and nodes per layer should be changable
  - [ ] A way to change the inputs, like adding a Random value for a dithery effect
  - idk stuff like that
- [x] Rendering the image at custom resolutions.
