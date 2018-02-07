# Application Version information

Quadro provides the `/_version` endpoint for returning application version information.

It returns the `version.json` file contents if it exists.
If `version.json` does not exist - `/_version` will return the 10 latest commits.
