I want the profile drawer to include the same icon as
is displayed.  Instead of j,k Or P,S I'd like to
make a call to gravatar or something to make a random
icon.

Then the same avatar is displayed, with Mrvin or Marvin and Susie below it
when the profile drawer is opened.  Then in the profile/sewttings drawer

There is just

\<icon> Basic Info     opens a panel to enter        (user name, age, spuse [] spouse name and age)
\<icon> Load/Save         opens a panel to Load/Save current data, or sample data
\<ison> Advanced Settings    opens a panel to enter      (the advanced settings)


----
[ ] Auto save
[ ] Dark mode

Instead of startup starting some special start up dialog, it just presents the Basic Info pane
If the pane is unpopulated, a top level context message says
enter basic personal info, or use load to load previously saved data.



I'd like load to start in ~/Library/retirement-model, and save instead of downloading saving a file
into ~/Library/retirement-model (IF a web app can do that).  And I'd like all the app state (accounts, spending, income, basic info...) to be saved on save, and loaded on load.  Including the gravatar if possible.


Also, everywhere input happens, hitting return should cause an event that reevaluates constraints, error conditions, etc.
