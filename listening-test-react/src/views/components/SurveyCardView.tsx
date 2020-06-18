import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField
} from "@material-ui/core";
import React from "react";
import {SurveyControlModel, SurveyControlType} from "../../shared/models/SurveyControlModel";
import {observer} from "mobx-react";


export const SurveyCardView =  observer(function (props) {
  const {items} = props as { items: SurveyControlModel[]};
  if (!items) return null;

  function renderControl(control: SurveyControlModel) {
    switch (control.type) {
      case SurveyControlType.text:
        return <TextField fullWidth variant="filled" label={control.question}
                          onChange={event => control.value = event.target.value}/>
      case SurveyControlType.radio:
        return <SurveyRadio control={control}/>
      case SurveyControlType.checkbox:
        return <SurveyCheckbox control={control}/>
      default:
        return null;
    }
  }

  return <Grid container spacing={3}>
    {items.map((c, i) =>
      <Grid item xs={12} key={i}>
        {renderControl(c)}
      </Grid>
    )}
  </Grid>
})

const SurveyRadio = observer((props: { control: SurveyControlModel }) => {
  const {control} = props;

  return <FormControl variant="filled" fullWidth>
    <FormLabel component="legend">{control.question}</FormLabel>
    <RadioGroup row value={control.value} onChange={(event => control.value = event.target.value)}>
      {control.options && control.options.map(o =>
        <FormControlLabel key={o} value={o} control={<Radio/>} label={o}/>
      )}
    </RadioGroup>
  </FormControl>
})

const SurveyCheckbox = observer((props: { control: SurveyControlModel }) => {
  const {control} = props;

  function handleCheckbox(event) {
    // To array for manipulation
    const values: string[] = control.value ? control.value.split(',') : [];
    if (event.target.checked) values.push(event.target.name)
    else values.splice(values.indexOf(event.target.name), 1);
    // To string for storing value
    control.value = values.toString();
  }

  return <FormControl variant="filled" fullWidth>
    <FormLabel component="legend">{control.question}</FormLabel>
    <FormGroup row>
      {control.options && control.options.map(o =>
        <FormControlLabel key={o} label={o} control={
          <Checkbox name={o} onChange={handleCheckbox}/>
        }/>
      )}
    </FormGroup>
    <FormHelperText/>
  </FormControl>
})
