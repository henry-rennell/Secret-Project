# Henry's Secret Project

### What is this repository?

We all have projects on the go, are you ever REALLY finished??

I started this repo to help showcase some of the code i've been writing for my longer term projects, despite the projects not yet being ready to deploy. The idea behind this is as somewhat of a proof of concept.

### Database configuration and why:

Hosting images in the S3 bucket provides the unique ability to generate a Pre-Signed URL for each image, not only does this link expire after a specified period, but it means the bucket itself is doing the heavy lifting providing the image for the front end. rather than constantly creating ReadStreams and converting to and from binary, it is also considerably more scalable than relying on the expansion of SQL database storage.

### What are you working on currently?

This project is a work in progress however I am currently in the process of creating a feature allowing users to "follow" other users in order to have their posts show up in their feed.