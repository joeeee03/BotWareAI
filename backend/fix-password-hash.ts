import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'BotWhatsapp!';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated hash:', hash);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
