# README ROUTES

** This document contains all the backend routes, and brief description of what it does

## Template of what this documentation should look like
* Title of your route (add your name so we know you created it)
* Brief description
* What type of request is it: CRUDE
* return type
* Error handling needed

## User Onboarding-Related Routes
* postRegister - sign ups (DONE - unchecked - Grace)
- New users should be able to sign up for an account. They should enter, at the very least, a login name, a password, a first and last name, an email address, an affiliation (such as Penn), and a birthday.
- * The password should be *salted* and encrypted following best practices.

* postLogin - The user should be able to log in with their user ID and password. (DONE - unchecked - Grace)
* uploadPhoto - Users should be able to *upload a profile photo* -- on mobile, perhaps even taking a selfie for that photo -- as a starting point.
* matchPhoto (with actors photo) - The user should be able to link to a given *actor account* from IMDB by matching the *embedding* of their selfie with the *profile photos* of the 5 most similar actors.  They will be able to choose from those actors.

* postLogout - allows users to logout (DONE - unchecked - grace)


* postTags - users should include a number of hashtags of interests
* getHashtags - return top-10 most popular hash tags (by occurrence) to be shown to users



## Posts-Related Routes (Joanna)
* createPost - contains optional image and optional text. post might include hashtags (each field is optional). BUT post should have at least SOME content
* deletePost 
* getFeed - users should see posts from themselves, friends, and prominent figures
* likePost - add a relationship of user and that post into the `posts_liked_by` table


## Comments-Related Routes
* createComment
* getComment



