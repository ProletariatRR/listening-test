import { observer } from "mobx-react";
import { AudioExampleModel, AudioFileModel } from "../../../shared/models/AudioTestModel";
import React, { useEffect, useState, forwardRef } from "react";
import Grid from "@material-ui/core/Grid";
// import Container from "@material-ui/core/Container";
import { SurveyControlRender } from "../../forms/SurveyControl.render";
import { AudioButton, AudioController, useAudioPlayer } from "../../web-audio/AudiosPlayer";
import { AudioLoading, useAllAudioRefsReady } from "../../web-audio/AudiosLoading";
import { useRandomization } from "../../../shared/tools/RandomizationTools";
import { ratingAreaStyle } from "../../../shared/SharedStyles";
import { AudioSectionLoopingController } from "../../web-audio/AudioSectionLoopingController";
import { Box, Slider, styled } from "@material-ui/core";
import TextField from '@material-ui/core/TextField';
// import { trace } from "console";
// import Button from '@material-ui/core/Button';
// import { values } from "mobx";

export const ApeTestItemExampleRender = observer(function (props: { example: AudioExampleModel, active?: boolean }) {
  const { example, active } = props;
  // Randomize first to make sure random audio match the dom tree
  const [randomAudios] = useRandomization(example.medias, active && example.settings?.randomMedia, example.settings?.fixLastInternalQuestion);
  // This is a custom hook that expose some functions for AudioButton and Controller
  const { refs, sampleRef, currentTime, handleTimeUpdate, handlePlay, handlePause, handleEnded } = useAudioPlayer(randomAudios, example.mediaRef, example);
  const allRefs = example.mediaRef ? [...refs, sampleRef] : refs;
  const loading = useAllAudioRefsReady(allRefs);
  // An event for setting Time update method
  const [onTimeUpdate, setOnTimeUpdate] = useState<() => void>();
  console.log(randomAudios);
  useEffect(() => {
    if (active === false) handlePause();
  }, [active, handlePause]);

  return <> <AudioLoading showing={loading} />
    <Grid container spacing={2} style={{ display: loading ? 'none' : 'flex' }}>
      {example.fields?.map((value, i) =>

        <Grid item xs={12} key={i}>
          <SurveyControlRender control={value} />
        </Grid>)}

      <Grid item xs={12}
        style={{
          position: 'relative',
          display: 'flex',
          height: `${220 + (randomAudios.length - 1) * 70}px`, // Dynamic height based on number of tracks
        }}>
        <Box
          style={{
            position: 'absolute',
            top: '60px',
            width: 'calc(100% - 16px)'
          }}>
          <HiddenSlider displayNumber={0} isActive={false} marks={marks} />
        </Box>

        {randomAudios.map((v, i) => (
          <Box
            key={i}
            style={{
              position: 'absolute',
              top: '60px',
              width: 'calc(100% - 16px)',
              zIndex: randomAudios.length - i,
              pointerEvents: 'none'  // Box 不拦截事件
            }}>
            <div style={{
              position: 'relative',
              height: '56px',
              pointerEvents: 'none'  // div 也不拦截事件
            }}>
              <ApeAudioButton
                ref={refs[i]}
                audio={v}
                audioNum={i + 1}
                onPlay={handlePlay}
                onPause={handlePause}
                onTimeUpdate={i === 0 ? onTimeUpdate ? onTimeUpdate : handleTimeUpdate : undefined}
                onEnded={i === 0 ? handleEnded : undefined}
              >
                {i + 1}
              </ApeAudioButton>
            </div>
          </Box>
        ))}

        {randomAudios.map((v, i) => (
          <Box
            key={i}
            style={{
              position: 'absolute',
              top: `${120 + i * 70}px`,  // Stack comments vertically with 70px spacing
              width: 'calc(100% - 16px)',
              zIndex: i + 1
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder={`Comments for Track ${i + 1}`}
              value={v.comment || ''}
              onChange={(e) => v.comment = e.target.value}
              size="small"
            />
          </Box>
        ))}
      </Grid>

      {example.mediaRef && <Grid item xs={12} style={ratingAreaStyle}>
        <AudioButton ref={sampleRef} audio={example.mediaRef}
          onPlay={handlePlay} onPause={handlePause}>Ref</AudioButton>
      </Grid>}

      <Grid item xs={12}>
        <AudioController refs={refs} sampleRef={sampleRef} currentTime={currentTime}
          disabled={example.settings?.disablePlayerSlider} />
        {example.settings?.sectionLooping &&
          <AudioSectionLoopingController setTimeUpdate={f => setOnTimeUpdate(f)}
            refs={allRefs} currentTime={currentTime} />}
      </Grid>
    </Grid>
  </>
});

const marks = [
  { value: 0, label: '0' },
  { value: 20, label: '20' },
  { value: 40, label: '40' },
  { value: 60, label: '60' },
  { value: 80, label: '80' },
  { value: 100, label: '100' },
];


const HiddenSlider = styled(Slider)(({ theme, isActive, displayNumber }: {
  theme: any,
  isActive: boolean,
  displayNumber: number,
}) => ({
  padding: 0,
  height: 0,
  zIndex: displayNumber === 0 ? 1 : (isActive ? 2000 : 2000 - displayNumber),
  pointerEvents: 'auto',  // 确保滑块可以接收事件
  '& .MuiSlider-track': {
    height: '0px',
  },
  '& .MuiSlider-rail': {
    visibility: displayNumber !== 0 ? 'hidden' : 'inherit',
  },
  '& .MuiSlider-thumb': {
    backgroundColor: isActive ? theme.palette.primary.main : theme.palette.common.white,
    border: `1px solid ${theme.palette.primary.main}`,
    height: 56,
    borderRadius: 3,
    transform: 'translateY(-38px)',
    visibility: displayNumber === 0 ? 'hidden' : 'inherit',
    pointerEvents: 'auto',  // 确保滑块手柄可以接收事件
    '&:before': {
      content: `"${displayNumber}"`,
      color: !isActive ? theme.palette.primary.main : theme.palette.common.white,
      fontSize: '14px',
    },
  },
}));


const ApeAudioButton = observer(
  forwardRef<
    HTMLAudioElement,
    {
      audio: AudioFileModel;
      audioNum: number;
      onPlay: (v: AudioFileModel) => void;
      onPause: () => void;
      onTimeUpdate?: () => void;
      onEnded?: () => void;
      children?: any;
    }
  >(function (props, ref) {
    useEffect(() => {
      // Set a default value
      const num = parseInt(audio.value);
      if (!num) audio.value = '0';
    });
    const { audio, audioNum, onTimeUpdate, onPlay, onPause, onEnded } = props;
    const [startX, setStartX] = useState(0);

    const handleChangeCommited = (event: React.ChangeEvent<{}>, value: number | number[]) => {
      if (Number(audio.value) === startX) {
        audio.isActive ? onPause() : onPlay(audio);
      }
    }

    return (
      <>
        <audio
          preload="auto"
          src={audio.src}
          controls
          ref={ref}
          style={{ display: 'none' }}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        />


        <HiddenSlider

          value={Number(audio.value)}
          min={0}
          max={100}
          step={1}
          // marks={Number(audioNum)==0?marks:false}
          valueLabelDisplay="auto"
          onChange={(_, value) => audio.value = value.toString()}

          isActive={audio.isActive}
          displayNumber={audioNum}

          onChangeCommitted={handleChangeCommited}
          onMouseDown={() => setStartX(Number(audio.value))}

        />


      </>
    );
  })
);