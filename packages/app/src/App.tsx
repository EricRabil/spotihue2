import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import ActivityBuilder from "./components/ActivityBuilder";
import ActivityContextProvider from "./components/ActivityContextProvider";
import ActivitySaver from "./components/ActivitySaver";
import PlaybackCard from "./components/PlaybackCard";
import { useStyles } from "./theme";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PlaybackSyncCard from "./views/PlaybackSyncCard";

export default function PersistentDrawerLeft() {
  const classes = useStyles();
  const theme = useTheme();

  return (

    <ActivityContextProvider>
      <Router>
        <Switch>
          <Route path="/card">
            <PlaybackSyncCard />
          </Route>
          <Route path="/">
            <div className={classes.root}>
              <CssBaseline />
              <AppBar
                position="fixed"
                className={classes.appBar}
              >
                <Toolbar>
                  <Grid container alignItems="center">
                    <Grid item xs>
                      <Typography variant="h6" noWrap>
                        Spotihue
                </Typography>
                    </Grid>
                    <Grid item>
                      <ActivitySaver />
                    </Grid>
                  </Grid>
                </Toolbar>
              </AppBar>
              <main className={classes.content}>
                <Grid container className={classes.activityGrid} spacing={3}>
                  <Grid item>
                    <PlaybackCard />
                  </Grid>
                  <ActivityBuilder />
                </Grid>
              </main>
            </div>
          </Route>
        </Switch>
      </Router>
    </ActivityContextProvider>
  );
}
