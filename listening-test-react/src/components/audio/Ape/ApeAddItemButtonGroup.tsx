import {observer} from "mobx-react";
import {AudioTestItemModel} from "../../../shared/models/AudioTestModel";
import {SurveyControlType, TestItemType} from "../../../shared/models/EnumsAndTypes";
import {v4} from "uuid";
import {Box, ListItemIcon, ListItemText, MenuItem} from "@material-ui/core";
import Icon from "@material-ui/core/Icon";
import React, {useRef} from "react";
import {AddQuestionButton, AddQuestionButtonType} from "../../utils/AddQuestionButton";
import {useMatStyles} from "../../../shared/SharedStyles";

export const ApeAddItemButtonGroup = observer(function (props: { onAdd: (type: AudioTestItemModel) => void}) {
  const {onAdd} = props;
  const classes = useMatStyles();
  const addQuestionMenu = useRef<AddQuestionButtonType>();

  const handleAdd = (type: TestItemType) => {
    let newItem: AudioTestItemModel;
    switch (type) {
      case TestItemType.example:
        newItem = {
          id: v4(), type: TestItemType.example, title: 'Title (Click to edit this)', example: {
            medias: [], fields: [
              {type: SurveyControlType.description, question: 'Compare the quality of these sounds.', value: null}
            ]
          }
        };
        break;
      case TestItemType.training:
        newItem = {
          id: v4(), type: TestItemType.training, title: 'Training Example (Click to edit this)', example: {
            medias: [], fields: [
              {type: SurveyControlType.description, question: 'Please listen these sounds.', value: null}
            ]
          }
        };
        break;
    }
    addQuestionMenu.current.closeMenu();
    onAdd(newItem);
  }



  return <Box className={classes.elementGroup}>
    <AddQuestionButton ref={addQuestionMenu} onAdd={onAdd}>
      <MenuItem onClick={() => handleAdd(TestItemType.example)}>
        <ListItemIcon>
          <Icon fontSize="small" style={{color: 'dodgerblue'}}>add_task</Icon>
        </ListItemIcon>
        <ListItemText>Audio Test</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAdd(TestItemType.training)}>
        <ListItemIcon>
          <Icon fontSize="small" style={{color: 'coral'}}>fitness_center</Icon>
        </ListItemIcon>
        <ListItemText>Audio Training Example</ListItemText>
      </MenuItem>
    </AddQuestionButton>
  </Box>;
});
