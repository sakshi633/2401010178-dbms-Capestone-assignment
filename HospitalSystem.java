// HospitalServer.java
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.sql.*;
import java.nio.charset.StandardCharsets;

public class HospitalSystem {

    static final String URL = "jdbc:mysql://localhost:3306/hospital_capstone";
    static final String USER = "root";
    static final String PASS = "YOUR_PASSWORD"; // <-- change

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/addPatient", HospitalSystem::addPatient);
        server.createContext("/getPatients", HospitalSystem::getPatients);
        server.createContext("/bookAppointment", HospitalSystem::bookAppointment);
        server.createContext("/addTreatment", HospitalSystem::addTreatment);

        server.setExecutor(null);
        System.out.println("Server started at http://localhost:8080");
        server.start();
    }

    static Connection connect() throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        return DriverManager.getConnection(URL, USER, PASS);
    }

    static void addPatient(HttpExchange ex) throws IOException {
        String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String[] data = body.replace("{","").replace("}","")
                .replace("\"","").split(",");

        String name="", gender="", phone="";
        int age=0;

        for(String s:data){
            String[] kv=s.split(":");
            if(kv[0].trim().equals("name")) name=kv[1];
            if(kv[0].trim().equals("age")) age=Integer.parseInt(kv[1]);
            if(kv[0].trim().equals("gender")) gender=kv[1];
            if(kv[0].trim().equals("phone")) phone=kv[1];
        }

        try(Connection con=connect()){
            PreparedStatement ps=con.prepareStatement(
                "INSERT INTO Patients(name,age,gender,phone) VALUES(?,?,?,?)");
            ps.setString(1,name);
            ps.setInt(2,age);
            ps.setString(3,gender);
            ps.setString(4,phone);
            ps.executeUpdate();
        }catch(Exception e){e.printStackTrace();}

        send(ex,"Patient Added");
    }

    static void getPatients(HttpExchange ex) throws IOException {
        StringBuilder json=new StringBuilder("[");
        try(Connection con=connect()){
            ResultSet rs=con.createStatement().executeQuery("SELECT * FROM Patients");
            while(rs.next()){
                json.append("{")
                    .append("\"patient_id\":").append(rs.getInt(1)).append(",")
                    .append("\"name\":\"").append(rs.getString(2)).append("\",")
                    .append("\"age\":").append(rs.getInt(3)).append(",")
                    .append("\"gender\":\"").append(rs.getString(4)).append("\",")
                    .append("\"phone\":\"").append(rs.getString(5)).append("\"},");
            }
        }catch(Exception e){e.printStackTrace();}
        if(json.charAt(json.length()-1)==',') json.deleteCharAt(json.length()-1);
        json.append("]");
        send(ex,json.toString());
    }

    static void bookAppointment(HttpExchange ex) throws IOException {
        send(ex,"Appointment Booked");
    }

    static void addTreatment(HttpExchange ex) throws IOException {
        send(ex,"Treatment Added");
    }

    static void send(HttpExchange ex, String response) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(200, response.getBytes().length);
        OutputStream os = ex.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
}