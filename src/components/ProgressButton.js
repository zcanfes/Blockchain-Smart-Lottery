
import { useEffect, useState, forwardRef } from "react"
import Button from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
import { blue } from '@mui/material/colors';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


const Alert = forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function ProgressButton({ text, state, onClick }) {
    const status = state && state.status

    const [value, setValue] = useState(0);
    const [exception, setException] = useState(false);

    useEffect(() => {
        if (status == "PendingSignature") {
            setValue(33)
        }
        else if (status == "Mining") {
            setValue(66)
        }
        else if (status == "Success") {
            setValue(0)
            handleClick()
        }
        else if (status == "Exception") {
            setException(true)
            setTimeout(() => {
                setException(false)
                setValue(0)
            }, 4000)
        }
    }, [status])

    const [open, setOpen] = useState(false);
    const handleClick = () => {
        setOpen(true);
    };
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    return (
        <>
            <Button
                variant="contained"
                disabled={value !== 0}
                onClick={onClick}
            >
                {!exception && value === 0 && text}
                {!exception && value !== 0 && status}
                {exception && state.errorMessage}

                {value !== 0 && (
                    <CircularProgress
                        size={24}
                        sx={{
                            color: blue[500],
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px',
                        }}
                    />
                )}
            </Button>

            <Snackbar anchorOrigin={{ vertical: "top", horizontal: "center" }} open={open} autoHideDuration={2000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '20%' }}>
                    Success
                </Alert>
            </Snackbar>
        </>
    );
}

export default ProgressButton;