import {Prompt, useHistory, useParams} from "react-router";
import React, {FunctionComponent, useContext, useEffect, useRef, useState} from "react";
import {AbTestModel} from "../../shared/models/AbTestModel";
import {GlobalDialog, GlobalSnackbar} from "../../shared/ReactContexts";
import {useScrollToView} from "../../shared/ReactHooks";
import Axios from "axios";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import {TextField} from "@material-ui/core";
import Loading from "../../layouts/components/Loading";
import {TestUrl} from "../../shared/models/EnumsAndTypes";
import {BasicTestModel, TestItemModel} from "../../shared/models/BasicTestModel";
import {observer} from "mobx-react";
import {observable} from "mobx";
import TestSettingsDialog from ".//TestSettingsDialog";
import DraggableZone from "../../shared/components/DraggableZone";
import {testItemsValidateError} from "../../shared/ErrorValidators";
import {TestItemCard} from "../components/TestItemCard";
import {ItemExampleModel} from "../../shared/models/ItemExampleModel";

export const TestDetailView = observer(function ({testUrl, TestItemExampleCard, ButtonGroup}: {
  testUrl: TestUrl,
  TestItemExampleCard: FunctionComponent<{ example: ItemExampleModel, title: React.ReactNode, action: React.ReactNode, expanded?: boolean }>,
  ButtonGroup: FunctionComponent<{ onAdd: (type: TestItemModel) => void }>
}) {
  const {id} = useParams();
  const [tests, setTests] = useState<BasicTestModel>(null);
  const [isError, setIsError] = useState(false);
  const history = useHistory();
  const openDialog = useContext(GlobalDialog);
  const openSnackbar = useContext(GlobalSnackbar);
  // Scroll properties
  const viewRef = useRef(null);
  const {scrollToView} = useScrollToView(viewRef);
  // No submit alert variable
  const [isSubmitted, setIsSubmitted] = useState<boolean>(null);

  // Request for server methods
  useEffect(() => {
    // If it is edit page, get data from back end
    if (+id !== 0) Axios.get<AbTestModel>('/api/' + testUrl, {params: {_id: id}})
      // Successful callback
      .then((res) => setTests(observable(res.data)), () => setIsError(true));
    // If in creation page
    else setTests(observable({name: '', description: '', items: []}));
  }, [id, testUrl]);

  const handleSubmit = () => {
    // Validate if all examples have been added audios
    const validationResult = testItemsValidateError(tests);
    if (validationResult) {
      openDialog(validationResult);
      return;
    }
    // Create a new text or modify current test
    if (+id === 0) {
      requestServer(true);
    } else Axios.get('/api/response-count', {params: {testId: id, testType: testUrl}}).then(res => {
      // After checking with server, if there are responses, it will create a new test.
      if (res.data > 0) openDialog(
        'This test already has some responses, save will create a new test. You can delete old one if you like.',
        'Reminder', null, () => requestServer(true));
      else requestServer(false);
    });
  }

  const requestServer = (isNew: boolean) => {
    setIsSubmitted(true);
    // Request server based on is New or not.
    Axios.request({
      method: isNew ? 'POST' : 'PUT', url: '/api/' + testUrl, data: tests
    }).then(() => {
      history.push('./');
      openSnackbar('Save successfully');
    }, reason => openDialog(reason.response.data, 'Something wrong'));
  }

  // Local methods
  const addItem = (newItem: TestItemModel) => {
    tests.items.push(newItem);
    scrollToView();
  }

  const deleteItem = (index: number) => tests.items.splice(index, 1);

  const handleReorder = (index: number, newIndex: number) => {
    // const value = tests.items[index];
    // tests.items[index] = tests.items[newIndex];
    // tests.items[newIndex] = value;
    // Insert and delete original
    const value = tests.items.splice(index, 1);
    tests.items.splice(newIndex, 0, ...value);
  }

  // Some components for performance boost
  const NameText = () => <TextField variant="outlined" label="Test Name" fullWidth defaultValue={tests.name}
                                    onChange={e => tests.name = e.target.value}/>;
  const DesText = () => <TextField variant="outlined" label="Test Description" rowsMax={8} multiline fullWidth
                                   defaultValue={tests.description}
                                   onChange={(e) => tests.description = e.target.value}/>;

  return (
    <Grid container spacing={2} justify="center" alignItems="center">
      <Prompt when={!isSubmitted} message={'You have unsaved changes, are you sure you want to leave?'}/>
      {tests ? <React.Fragment>
        <Grid item xs={12} container alignItems="center" spacing={1}>
          <Grid item style={{flexGrow: 1}}/>
          <Grid item><TestSettingsDialog settings={tests.settings} onConfirm={settings => tests.settings = settings}/></Grid>
          <Grid item><Button color="primary" variant="contained" onClick={handleSubmit}>Save</Button></Grid>
        </Grid>

        <Grid item xs={12}><NameText/></Grid>
        <Grid item xs={12}><DesText/></Grid>
        {tests.items.map((v, i) =>
          <Grid item xs={12} ref={viewRef} key={v.id}>
            <DraggableZone index={i} length={tests.items.length} onReorder={handleReorder}>
              <TestItemCard value={v} onDelete={() => deleteItem(i)} TestItemExampleCard={TestItemExampleCard}/>
            </DraggableZone>
          </Grid>
        )}
        <Grid item container justify="center" xs={12}>
          <ButtonGroup onAdd={addItem}/>
        </Grid>

        <Grid item xs={12} container alignItems="center" spacing={1}>
          <Grid item style={{flexGrow: 1}}/>
          <Grid item><TestSettingsDialog settings={tests.settings} onConfirm={settings => tests.settings = settings}/></Grid>
          <Grid item><Button color="primary" variant="contained" onClick={handleSubmit}>Save</Button></Grid>
        </Grid>
      </React.Fragment> : <Grid item><Loading error={isError}/></Grid>}
    </Grid>
  )
})
