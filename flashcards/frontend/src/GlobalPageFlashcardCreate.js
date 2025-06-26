import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import { Field } from '@atlaskit/form';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Textfield from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import './GlobalPageDeckCreate.css';

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

function CreateFlashcardGlobal( { closeFlashcardModal }) {

  // State management
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [locked, setLocked] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [closeError, setCloseError] = useState(true);

  const [showHint, setShowHint] = useState(false);

  // Handle Close
  const handleClose = () => {
    if (typeof closeFlashcardModal === 'function') {
      closeFlashcardModal(); // Call the function passed as a prop
    } else {
      console.error('closeFlashcardModal is not a function:', closeFlashcardModal);
    }
  };

  //Handle Save
  const handleSave = async () => {
    setErrorMessage('');
    setCloseError(true);

    //limits for front and back of flashcard text
    if (front.length > 100) {
      setErrorMessage('Front of flashcard must be 100 characters or fewer.');
      return;
    }
    if (back.length > 100) {
      setErrorMessage('Back of flashcard must be 100 characters or fewer.');
      return;
    }

    // Creating the flashcard
    try {
      const response = await invoke('createFlashcard', {
        front: front,
        back: back,
        hint: hint,
        locked: locked
      });

      //clear fields
      setFront('');
      setBack('');
      setHint('');

      if (response && response.success) {
          setSaveSuccess(true); // Show success message
          setTimeout(() => {
            closeFlashcardModal(response.card); // Delay closing modal
          }, 1000); // Show success message for 1 seconds before closing
      } else {
          setErrorMessage(response.error);
          console.error('Failed to create flashcard:', response.error);
      }
    } catch (error) {
      console.error('Error invoking createFlashcard:', error);
    }
  };

  return (
    <ModalTransition>
      <Modal onClose={closeFlashcardModal}>
        {/************************************* HEADER SECTION ***************************************/}
        <ModalHeader>
          <Grid templateAreas={['title close']} xcss={gridStyles}>
            <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
              <IconButton
                appearance="subtle"
                icon={CrossIcon}
                label="Close Modal"
                onClick={closeFlashcardModal}
              />
            </Flex>
            <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
              <ModalTitle>Create New Flashcard</ModalTitle>
            </Flex>
          </Grid>
        </ModalHeader>
        {/************************************* ERROR MESSAGE ***************************************/}
        <ModalBody>
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

        </ModalBody>

        {/************************************* ACTION BUTTONS ***************************************/}
        <ModalFooter>
          <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
          <Button appearance="primary" onClick={handleSave}>Create Flashcard</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
}

export default CreateFlashcardGlobal;

