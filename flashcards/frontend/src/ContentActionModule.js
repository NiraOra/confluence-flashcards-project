import React, { useState } from 'react';
import { invoke, view } from '@forge/bridge';
import { Alert, Collapse } from '@mui/material';
import { Field } from '@atlaskit/form';
import Button, { IconButton } from '@atlaskit/button/new';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Textfield from '@atlaskit/textfield';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './ContentActionModule.css';

//grid and layout styles
const gridStyles = xcss({
  width: '100%',
});
const closeContainerStyles = xcss({
  gridArea: 'close',
});
const titleContainerStyles = xcss({
  gridArea: 'title',
});

function ContentActionModule() {

  //State management
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);

  const [locked, setLocked] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [closeError, setCloseError] = useState(true);

  // Reset Form Fields
  const resetForm = () => {
    setFront('');
    setBack('');
    setHint('');
    setLocked(false);
  };

  // Save Functionality
  const handleSave = async () => {

    setErrorMessage('');
    setCloseError(true);

    try {

      const response = await invoke('createFlashcard', {
        front: front,
        back: back,
        hint: hint,
        locked: locked
      });

      //reset form on success
      if (response && response.success) {

        //reset form as flashcard has been saved
        resetForm();

        //show success message to user
        setSaveSuccess(true);

        //close the popup after 1 second
        setTimeout(handleClose,1000);

      } else {

          setErrorMessage(response.error);

          console.error('Failed to create flashcard:', response.error);
      }
    } catch (error) {

      setErrorMessage(error);

      console.error('Error invoking createFlashcard:', error);
    }

  };

  //close functionality
  const handleClose = () => {
    //reset form
    resetForm();

    //close pop up
    view.close();
  };

  return (

    <div className="flashcard-creation">

      {/************************************* HEADER SECTION ***************************************/}
      <Grid templateAreas={['title close']} xcss={gridStyles}>
        <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
          <IconButton
            appearance="subtle"
            icon={CrossIcon}
            label="Close Modal"
            onClick={handleClose}
          />
        </Flex>
        <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
          <AutoAwesomeIcon className="content-action-flash-icon" />
          <h2>Cardify.ai - Create a flashcard</h2>
        </Flex>
      </Grid>

      {/************************************* ERROR MESSAGE ***************************************/}
      {errorMessage &&
        <Collapse in={closeError}>
          <Alert
            severity="error"
            onClose={() => setCloseError(false)}
          >
            {errorMessage}
          </Alert>
        </Collapse>
      }

      {/************************************* FLASHCARD FRONT FIELD ***************************************/}
      <Field id="flashcard-front" name="flashcard-front" label="Flashcard Front">
        {({ fieldProps }) => (
          <Textfield {...fieldProps} value={front} onChange={(e) => setFront(e.target.value)} placeholder="Type the front of the flashcard here..." />
        )}
      </Field>

      {/************************************* FLASHCARD BACK FIELD ***************************************/}
      <Field id="flashcard-back" name="flashcard-back" label="Flashcard Back">
        {({ fieldProps }) => (
          <Textfield {...fieldProps} value={back} onChange={(e) => setBack(e.target.value)} placeholder="Type the back of the flashcard here..." />
        )}
      </Field>

      {/************************************* HINT FIELD ***************************************/}
      <Field id="flashcard-hint" name="flashcard-hint" label={
        <div onClick={() => setShowHint(!showHint)} className="label-clickable">
          <span>Hint (Optional)</span>
          <span className="toggle-icon">
            {showHint ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small" />}
          </span>
        </div>
      }>
        {({ fieldProps }) => (
          <>
            {showHint && (
              <Textfield
                {...fieldProps}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Type a hint for the flashcard..."
              />
            )}
          </>
        )}
      </Field>

      {/************************************* LOCK/UNLOCKED FIELD ***************************************/}
      <Field>
        {() => (
          <span onClick={() => setLocked(!locked)} style={{ cursor: 'pointer', justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
            {locked ? 'This flashcard will be locked, only the owner can edit and delete' : 'This flashcard will be unlocked, others can edit and delete'}
            <span>
              {locked ? (
                <LockIcon label="Locked" />
              ) : (
                <UnlockIcon label="Unlocked" />
              )}
            </span>
          </span>
        )}
      </Field>

      {/************************************* SUCCESS MESSAGE ***************************************/}
      {saveSuccess && <Alert severity="success"> New flashcard created successfully! </Alert>}

      {/************************************* ACTION BUTTONS ***************************************/}
      <div className="content-action-button-group">
        <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
        <Button appearance="primary" onClick={handleSave}>Create Flashcard</Button>
      </div>
    </div>
  );
}

export default ContentActionModule;
