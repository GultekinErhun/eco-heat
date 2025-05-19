import { VStack, Text, Button, HStack, Box } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { get_notes } from "../api/endpoints"
import { useAuth } from "../context/useAuth";

const Menu = () => {
    const [notes, setNotes] = useState([])
    const { user, logoutUser } = useAuth();

    useEffect(() => {
        const fetchNotes = async () => {
            const notes = await get_notes();
            setNotes(notes)
        }
        fetchNotes();
    }, [])

    const handleLogout = async () => {
        await logoutUser()
    };

    return (
        <VStack alignItems='start' spacing={6}>
            <Text fontSize='42px' pb='10px'>Welcome {user ? user.username : 'Guest'} 👋</Text>
            
            <Box>
                <Text fontSize='24px' mb='15px'>Your Notes</Text>
                <VStack alignItems='start' spacing={2}>
                    {notes.map((note) => {
                        return <Text key={note.id} fontSize='22px'>{note.name}</Text>
                    })}
                </VStack>
            </Box>
            
            <Box pt='10px'>
                <Text fontSize='24px' mb='15px'>Quick Access</Text>
                <Link to="/dashboard">
                    <Button colorScheme='green' size='lg' mb={4}>
                        Open EcoHeat Dashboard
                    </Button>
                </Link>
            </Box>
            
            <Button onClick={handleLogout} colorScheme='red' mt={4}>Logout</Button>
        </VStack>
    )
}

export default Menu;